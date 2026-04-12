/**
 * infrastructure_spreadsheet_repository.gs
 */

import { Timestamp } from "../domain/domain_save_timestamp"


export class SpreadsheetRepository {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.sheet = sheet;
  }
  save(timestamp: Timestamp) {
    const row = this.sheet.getLastRow()
    this.sheet.getRange(row + 1, 1).setValue(timestamp.time);
  }
}