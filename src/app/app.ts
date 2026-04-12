/**
 * app/app.ts
 */

import { SaveTimestampUseCase, RespondToClientUseCase } from "../usecase/usecase";
import { SpreadsheetRepository } from "../infrastructure/infrastructure_spreadsheet_repository";
import { SaveTimeStampCommand } from "../usecase/commands";
import { Client, Timestamp, TimeString } from "../domain/domain_save_timestamp";

export const App = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");
  if (!sheet) {
    console.log("シート \"log\" が存在しません。")
    return ContentService.createTextOutput("OK");
  }
  const repository = new SpreadsheetRepository(sheet)

  const saveTimestampUseCase = new SaveTimestampUseCase(repository);
  const respondToClientUseCase = new RespondToClientUseCase();

  function doPost(e: GoogleAppsScript.Events.DoPost) {
    try {
      // Interactivity payload
      if (e.parameter && e.parameter.payload) {
        const payload = JSON.parse(e.parameter.payload);
        const client = new Client(payload.user.id);
        const timestamp = new Timestamp(client, new TimeString(new Date().toISOString()));
        const command = new SaveTimeStampCommand(timestamp);
        saveTimestampUseCase.execute(command);
      }

      // Events API
      const contentType = e.postData ? e.postData.type : '';
      const raw = e.postData ? e.postData.contents : '';

      // if (contentType && contentType.indexOf('application/json') !== -1 && raw) {
      //   const body = JSON.parse(raw);
      //   return handleEvent(body);
      // }

      return jsonResponse({ ok: false, error: 'unsupported_request' });
    } catch (err: any) {
      console.error(err);
      return jsonResponse({ ok: false, error: String(err) });
    }
  }
};


function jsonResponse(obj: object) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}