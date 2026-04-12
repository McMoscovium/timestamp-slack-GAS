function myFunction() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const copyRange = sheet.getRange("A1:A3").getValues();
  const channels = {};
  copyRange.forEach((channel) => {
    channels[channel[0]] = channel[1];
  });
  console.log(channels);
}

function doPost(e) {
  Logger.log(JSON.stringify(e));
  sheetLog(JSON.stringify(e));
  return ContentService.createTextOutput("OK");
}

function test_doPost() {
  const e = {
    postData: {
      contents: JSON.stringify({
        name: "aiueo",
        age: 15
      }),
      type: "application/json",
      length: 27
    }
  };
  const response = doPost(e);
  console.log(response.getContent());
}

function sheetLog(content) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");
  const row = sheet.getLastRow();
  sheet.getRange(row + 1, 1).setValue(content);
}