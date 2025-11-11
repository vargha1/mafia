export declare class AuthenticateDto {
    token: string;
}
export declare class JoinRoomDto {
    gameId: string;
}
export declare class LeaveRoomDto {
    gameId: string;
}
export declare class ToggleReadyDto {
    gameId: string;
}
export declare class StartGameDto {
    gameId: string;
}
export declare class SendMessageDto {
    gameId: string;
    message: string;
    username: string;
}
export declare class VoteDto {
    gameId: string;
    targetPlayerId: string;
}
export declare class EliminatePlayerDto {
    gameId: string;
    playerId: string;
}
export declare class NextPhaseDto {
    gameId: string;
}
export declare class WebRTCOfferDto {
    gameId: string;
    offer: any;
    targetUserId: string;
}
export declare class WebRTCAnswerDto {
    gameId: string;
    answer: any;
    targetUserId: string;
}
export declare class WebRTCIceCandidateDto {
    gameId: string;
    candidate: any;
    targetUserId: string;
}
