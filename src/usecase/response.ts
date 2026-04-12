/**
 * usecase/response.ts
 */

import type { Timestamp } from "../domain/domain_save_timestamp";

export abstract class TimestampResponseSender {
  abstract notifyTimestampSaved(timeStamp: Timestamp): void
}