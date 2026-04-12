/**
 * domain_save_timestamp.gs 
*/

/**
 * タイムスタンプを保存し、それを要求者に通知するドメイン
 */
class TimeStamp {
  constructor(client, time) {
    this.client = client;
    this.time = time;
  }
};

class Client {
  constructor(responseHandle, id) {
    self.responseHandle = responseHandle;
    self.id = id;
  }
};

class Time {
  constructor(time) {
    this.time = time;
  }
};

class TimeStampRepository {
  save(timeStamp) {
  }
};

class ResponseHandle { }