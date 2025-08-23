// 게임판 위치 타입
export interface BoardPosition {
  row: number;
  col: number;
}

// 삼각형 타입
export interface Triangle {
  id: string;
  position: BoardPosition;
  type: "up" | "down"; // 위쪽을 향하는 삼각형인지 아래쪽을 향하는 삼각형인지
  isOccupied: boolean;
  pieceId?: string; // 말이 있는 경우 말의 ID
  isHighlighted: boolean;
  isSelected: boolean;
}

// 말(말) 타입
export interface GamePiece {
  id: string;
  type: "general" | "strategy"; // 장수 말인지 책략가 말인지
  stats: {
    sun: number; // 해 (우측 전진 방향 공격력 1-3)
    moon: number; // 달 (좌측 전진 방향 공격력 1-3)
    move: number; // 발 (이동 가능한 칸 수 1-5)
    star: number; // 별 (병력 수/통솔력 1-5)
  };
  position: BoardPosition;
  owner: string; // 플레이어 ID
  isActive: boolean;
}

// 게임 액션 타입
export interface GameAction {
  type: "move" | "attack";
  pieceId: string;
  targetPosition?: BoardPosition;
  targetPieceId?: string;
}

// 게임 결과 타입
export interface GameResult {
  winner: string;
  reason: "knock" | "elimination" | "surrender";
  finalScore: {
    [playerId: string]: number;
  };
  gameDuration: number; // 게임 진행 시간 (초)
}

// 플레이어 정보 타입
export interface PlayerInfo {
  id: string;
  name: string;
  isGuest: boolean;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}
