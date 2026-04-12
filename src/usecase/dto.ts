/**
 * usecase/sto.ts
 */

export class TimeStampDto {
  time: string
  userId: string
  constructor(time: string, userId: string) {
    this.time = time;
    this.userId = userId;
  }
}