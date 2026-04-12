/**
 * domain_save_timestamp.gs 
*/

/**
 * タイムスタンプを保存し、それを要求者に通知するドメイン
 */
export class Timestamp {
  client: Client;
  time: TimeString;
  constructor(client: Client, time: TimeString) {
    this.client = client;
    this.time = time;
  }
};

export class Client {
  id: Id;

  constructor(id: string) {
    this.id = id;
  }
};


abstract class Time {
  abstract toString(): string;
};


export class TimeString extends Time {
  time: string;
  constructor(time: string) {
    super();
    this.time = time;
  }
  toString(): string {
    return this.time;
  }
};


export abstract class TimeStampRepository {
  save(timeStamp: Timestamp) {
  }
};

class ResponseHandle { };
abstract class Id { };