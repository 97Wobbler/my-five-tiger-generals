export enum GamePhase {
  SETUP = "setup", // 게임 설정
  PLAYER_TURN = "player_turn", // 플레이어 턴
  OPPONENT_TURN = "opponent_turn", // 상대방 턴
  BATTLE = "battle", // 전투
  GAME_OVER = "game_over", // 게임 종료
}

export interface Player {
  id: string;
  name: string;
  pieces: string[]; // 말 ID 배열
  score: number;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  currentTurn: number;
  currentPlayer: string; // 현재 턴인 플레이어 ID
  players: Player[];
  board: unknown; // 게임판 상태 (나중에 구현)
  winner: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GameStateManager {
  private state: GameState;

  constructor(gameId: string, player1: Player, player2: Player) {
    this.state = {
      id: gameId,
      phase: GamePhase.SETUP,
      currentTurn: 1,
      currentPlayer: player1.id,
      players: [player1, player2],
      board: null,
      winner: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public nextTurn() {
    this.state.currentTurn++;
    this.state.currentPlayer = this.state.currentPlayer === this.state.players[0].id ? this.state.players[1].id : this.state.players[0].id;
    this.state.updatedAt = new Date();
  }

  public setPhase(phase: GamePhase) {
    this.state.phase = phase;
    this.state.updatedAt = new Date();
  }

  public setWinner(playerId: string) {
    this.state.winner = playerId;
    this.state.phase = GamePhase.GAME_OVER;
    this.state.updatedAt = new Date();
  }
}
