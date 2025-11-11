import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength, MinLength } from 'class-validator';

export class AuthenticateDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;
}

export class ToggleReadyDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;
}

export class StartGameDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  message: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  username: string;
}

export class VoteDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  targetPlayerId: string;
}

export class EliminatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  playerId: string;
}

export class NextPhaseDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;
}

export class WebRTCOfferDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsNotEmpty()
  offer: any; // WebRTC offer object

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  targetUserId: string;
}

export class WebRTCAnswerDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsNotEmpty()
  answer: any; // WebRTC answer object

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  targetUserId: string;
}

export class WebRTCIceCandidateDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  gameId: string;

  @IsNotEmpty()
  candidate: any; // WebRTC ICE candidate object

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  targetUserId: string;
}