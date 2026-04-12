/**
 * usecase/commands.ts
 */

import { Timestamp } from "../domain/domain_save_timestamp"
import { Client } from "../domain/domain_save_timestamp"


export class SaveTimeStampCommand {
  timestamp: Timestamp;
  constructor(timestamp: Timestamp) {
    this.timestamp = timestamp;
  }
}

export class RespondToClientCommand {
  client: Client
  constructor(client: Client) {
    this.client = client;
  }
}