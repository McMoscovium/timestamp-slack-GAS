/**
 * infrastructure/slack_notifier.ts
 */

import type { Timestamp } from "../domain/domain_save_timestamp";
import { TimestampResponseSender } from "../usecase/response";

class SlackTimestampResponseSender extends TimestampResponseSender {
  userId: string
  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  notifyTimestampSaved(timeStamp: Timestamp): void {
    const text = "タイムスタンプを保存しました。"
    this.publishHomeView(timeStamp.time.toString())
  }

  publishHomeView(time: string) {
    const token = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');

    const blocks = [];

    if (time) {
      const recorded = time
        ? Utilities.formatDate(new Date(time), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss')
        : null;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: recorded
            ? `:white_check_mark: 保存完了\n記録時刻: ${recorded}`
            : `:white_check_mark: 保存完了`
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
      user_id: this.userId,
      view: {
        type: 'home',
        blocks: blocks
      }
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "post",
      contentType: "application/json; charset=utf-8",
      headers: {
        Authorization: "Bearer " + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }

    const response = UrlFetchApp.fetch('https://slack.com/api/views.publish', options);

    const result = JSON.parse(response.getContentText());


    if (!result.ok) {
      throw new Error('views.publish failed: ' + response.getContentText());
    }
  }
}
