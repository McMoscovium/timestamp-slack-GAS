const SHEET_NAME = 'log';
const QUEUE_KEY="slack_action_queue"

/**
 * 初期設定用:
 * 1回だけ実行して、Script Properties に値を保存する
 */
function setupProperties() {
  const props = PropertiesService.getScriptProperties();

  props.setProperties({
    SLACK_BOT_TOKEN: 'xoxb-10859398409155-10885879376194-kpvx7ayMraWGkXpIetDNNO8u',
    SPREADSHEET_ID: '1cMirMugbAMNehdGUgt10LmZLw2Iz12XM3N5_B1x6lUg'
  });
}

/**
 * Slack からの POST を受ける
 */
function doPost(e) {
  try {
    // Interactivity payload
    if (e.parameter && e.parameter.payload) {
      const payload = JSON.parse(e.parameter.payload);
      return handleInteractive(payload);
    }

    // Events API
    const contentType = e.postData ? e.postData.type : '';
    const raw = e.postData ? e.postData.contents : '';

    if (contentType && contentType.indexOf('application/json') !== -1 && raw) {
      const body = JSON.parse(raw);
      return handleEvent(body);
    }

    return jsonResponse({ ok: false, error: 'unsupported_request' });
  } catch (err) {
    console.error(err);
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/**
 * Slack Events API を処理
 */
function handleEvent(body) {
  if (body.type === 'url_verification') {
    return ContentService
      .createTextOutput(body.challenge)
      .setMimeType(ContentService.MimeType.TEXT);
  }

  if (body.type === 'event_callback') {
    const event = body.event;
    if (event.type === 'app_home_opened' && event.tab === 'home') {
      publishHomeView(event.user,"");
    }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: true });
}

/**
 * Slack のインタラクティブ操作を処理
 */
function handleInteractive(payload) {
  if (payload.type !== 'block_actions') {
    return jsonResponse({ ok: true });
  }

  const action = payload.actions && payload.actions[0];
  if (!action || action.action_id !== 'record_time_button') {
    return jsonResponse({ ok: true });
  }

  const item = {
    ts: new Date().toISOString(),
    userId: payload.user?.id || '',
    teamId: payload.team?.id || '',
    actionId: action.action_id || '',
    requestTs: String(Date.now())
  };

  enqueueJob(item);
  ensureWorkerTrigger();

  // Slack へは即時応答
  // ここでスプレッドシートは開かない
  return jsonResponse({ ok: true });
}

/**
 * スプレッドシートへ追記
 */
function appendLogRow({ timestamp, userId, actionId, teamId }) {
  const spreadsheetId = getRequiredProperty_('SPREADSHEET_ID');
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`Sheet not found: ${SHEET_NAME}`);
  }

  sheet.appendRow([
    timestamp,
    userId || '',
    actionId || '',
    teamId || ''
  ]);
}

function test_appendLogRow(){
  const test1={
    timestamp: 125,
    userId : "u213984723",
    actionId: "action1",
    teamId: "team1"
  }
  appendLogRow(test1);
}

/**
 * キューへ投入
 */
function enqueueJob(item) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(item);
    props.setProperty(QUEUE_KEY, JSON.stringify(queue));
  } finally {
    lock.releaseLock();
  }
}

/**
 * ワーカートリガーを作成
 */
function ensureWorkerTrigger() {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const triggers = ScriptApp.getProjectTriggers();
    const exists = triggers.some(t => t.getHandlerFunction() === 'processQueue');
    if (!exists) {
      ScriptApp.newTrigger('processQueue')
        .timeBased()
        .after(1000) // 1秒以上後
        .create();
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * ワーカー本体
 */
function processQueue() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  let queue = [];
  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(QUEUE_KEY);
    queue = raw ? JSON.parse(raw) : [];

    // 先にキューを空にする
    props.deleteProperty(QUEUE_KEY);
  } finally {
    lock.releaseLock();
  }

  try {
    if (queue.length === 0) {
      return;
    }

    const spreadsheetId = getRequiredProperty_('SPREADSHEET_ID');
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    const values = queue.map(item => [
      new Date(item.ts),
      item.userId,
      item.actionId,
      item.teamId
    ]);

    const startRow = sheet.getLastRow() + 1;
    sheet
      .getRange(startRow, 1, values.length, values[0].length)
      .setValues(values);
    
    // 書き込み成功後に、各ユーザーの Home を更新
    const notifiedUsers = new Set();
    for (const item of queue) {
      if (!item.userId || notifiedUsers.has(item.userId)) continue;
      publishHomeView(item.userId, {
        text: '記録が完了しました。',
        recordedAt: item.ts
      });
      notifiedUsers.add(item.userId);
    }

  } catch (err) {
    // 失敗したらキューへ戻す
    requeue(queue);
    throw err;
  } finally {
    deleteWorkerTriggers_();
  }

  // 実行中に新しい押下が入った場合に備えて、残件があれば再度起動
  if (hasPendingQueue_()) {
    ensureWorkerTrigger();
  }
}

function requeue(items) {
  if (!items || items.length === 0) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const props = PropertiesService.getScriptProperties();
    const raw = props.getProperty(QUEUE_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const merged = items.concat(current);
    props.setProperty(QUEUE_KEY, JSON.stringify(merged));
  } finally {
    lock.releaseLock();
  }
}

function hasPendingQueue_() {
  const raw = PropertiesService.getScriptProperties().getProperty(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  return queue.length > 0;
}

function deleteWorkerTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === 'processQueue') {
      ScriptApp.deleteTrigger(t);
    }
  }
}

function publishHomeView(userId, status) {
  const token = getRequiredProperty_('SLACK_BOT_TOKEN');

  const blocks = [];

  if (status && status.text) {
    const recorded = status.recordedAt
      ? Utilities.formatDate(new Date(status.recordedAt), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
      : null;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: recorded
          ? `:white_check_mark: ${status.text}\n記録時刻: ${recorded}`
          : `:white_check_mark: ${status.text}`
      }
    });

    blocks.push({ type: 'divider' });
  }

  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*記録アプリ*\nボタンを押すと現在時刻を記録します。\n 2026/4/10 19:21 更新'
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '時刻を記録'
          },
          action_id: 'record_time_button',
          value: 'record'
        }
      ]
    }
  );

  const payload = {
    user_id: userId,
    view: {
      type: 'home',
      blocks: blocks
    }
  };

  const options={
    method: "post",
    contentType: "application/json; charset=utf-8",
    headers:{
      Authorization: "Bearer "+ token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }

  const response = UrlFetchApp.fetch('https://slack.com/api/views.publish', options);

  const result = JSON.parse(response.getContentText());

  Logger.log(text);
  
  if (!result.ok) {
    throw new Error('views.publish failed: ' + response.getContentText());
  }
}


function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRequiredProperty_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(`Missing Script Property: ${key}`);
  }
  return value;
}
