/**
 * usecase/usecase.ts
 */

import { SaveTimeStampCommand, RespondToClientCommand } from "./commands";
import { TimeStampDto } from "./dto";
import { TimeStampRepository } from "../domain/domain_save_timestamp";

export class SaveTimestampUseCase {
  repository: TimeStampRepository;

  constructor(repository: TimeStampRepository) {
    this.repository = repository;
  }

  execute(command: SaveTimeStampCommand) {
    this.repository.save(command.timestamp);
  }
}

export class RespondToClientUseCase {
  execute(command: RespondToClientCommand) {

  }
}