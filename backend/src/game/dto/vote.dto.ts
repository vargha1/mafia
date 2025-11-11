import { IsNotEmpty, IsString } from 'class-validator';

export class VoteDto {
  @IsNotEmpty()
  @IsString()
  targetPlayerId: string;
}
