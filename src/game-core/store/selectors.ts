import type { GameState, Piece, Player, TileId, Action } from "../types";
import { canMoveToNeighbor, normalizeActionType } from "../engine";

// 기본 게임 상태 선택자
export const selectGameState = (state: GameState) => state;
export const selectTurn = (state: GameState) => state.turn;
export const selectActivePlayer = (state: GameState) => state.activePlayer;
export const selectPieces = (state: GameState) => state.pieces;
export const selectBoard = (state: GameState) => state.board;
export const selectActionLog = (state: GameState) => state.actionLog;

// 턴 상태 선택자
export const selectTurnState = (state: GameState) => state.turnState;
export const selectActionsRemaining = (state: GameState) => state.turnState?.actionsRemaining ?? 0;
export const selectLastActionByPiece = (state: GameState) => state.turnState?.lastActionByPiece ?? {};

// 이동 상태 선택자
export const selectMoveState = (state: GameState) => state.moveState;
export const selectIsMoving = (state: GameState) => !!state.moveState;
export const selectMovingPiece = (state: GameState) => {
    if (!state.moveState) return null;
    return state.pieces[state.moveState.pieceId];
};

// 플레이어별 말 선택자
export const selectPiecesByPlayer = (state: GameState, player: Player): Piece[] => {
    return Object.values(state.pieces).filter((piece) => piece.owner === player);
};

export const selectPlayerPieces = (state: GameState, player: Player): Record<string, Piece> => {
    const pieces: Record<string, Piece> = {};
    Object.entries(state.pieces).forEach(([id, piece]) => {
        if (piece.owner === player) {
            pieces[id] = piece;
        }
    });
    return pieces;
};

// 특정 말 선택자
export const selectPieceById = (state: GameState, pieceId: string): Piece | undefined => {
    return state.pieces[pieceId];
};

export const selectPieceByTile = (state: GameState, tileId: TileId): Piece | undefined => {
    return Object.values(state.pieces).find((piece) => piece.tile === tileId);
};

// 게임 진행 상태 선택자
export const selectIsGameOver = (state: GameState): boolean => {
    // 승리 조건 체크 (간단한 버전)
    const players = state.players;

    // players가 없으면 게임이 아직 초기화되지 않았거나 기본 상태
    if (!players) return false;

    // 노크 3회 달성 체크
    const playerA = players.A;
    const playerB = players.B;
    if (playerA?.knockCount >= 3 || playerB?.knockCount >= 3) return true;

    // 모든 말이 패전한 경우 체크
    const allPieces = Object.values(state.pieces);
    const allDefeated = allPieces.every((piece) => piece.defeats >= 2);
    if (allDefeated) return true;

    return false;
};

// 가능한 액션 선택자
export const selectPossibleMoves = (state: GameState, pieceId: string): TileId[] => {
    const piece = state.pieces[pieceId];
    if (!piece) return [];

    const neighbors = state.board.adjacency[piece.tile] || [];
    return neighbors.filter((tileId) => {
        // 이미 말이 있는 타일은 제외
        const occupant = selectPieceByTile(state, tileId);
        if (occupant && occupant.owner !== piece.owner) return false;

        // 이동 가능한지 확인
        return canMoveToNeighbor(state, pieceId, tileId);
    });
};

export const selectPossibleTargets = (state: GameState, pieceId: string): string[] => {
    const piece = state.pieces[pieceId];
    if (!piece) return [];

    const neighbors = state.board.adjacency[piece.tile] || [];
    return neighbors
        .map((tileId) => {
            const target = selectPieceByTile(state, tileId);
            if (target && target.owner !== piece.owner) {
                return target.id;
            }
            return null;
        })
        .filter((id): id is string => id !== null);
};

// 현재 턴에서 가능한 액션 선택자
export const selectCanPerformAction = (state: GameState, pieceId: string, actionType: Action["type"]): boolean => {
    const piece = state.pieces[pieceId];
    if (!piece) return false;

    // 현재 플레이어의 턴인지 확인
    if (piece.owner !== state.activePlayer) return false;

    // 행동력이 남아있는지 확인
    if ((state.turnState?.actionsRemaining ?? 0) <= 0) return false;

    // 이미 해당 말이 같은 액션을 수행했는지 확인
    const lastActions = state.turnState?.lastActionByPiece?.[pieceId] || [];
    const normalizedAction = normalizeActionType(actionType);
    if (lastActions.includes(normalizedAction)) return false;

    return true;
};

// 게임 통계 선택자
export const selectGameStats = (state: GameState) => {
    const pieces = Object.values(state.pieces);
    const totalPieces = pieces.length;
    const totalTroops = pieces.reduce((sum, piece) => sum + piece.troops, 0);
    const totalDefeats = pieces.reduce((sum, piece) => sum + piece.defeats, 0);

    return {
        totalPieces,
        totalTroops,
        totalDefeats,
        averageTroops: totalPieces > 0 ? totalTroops / totalPieces : 0,
    };
};

// 디버깅용 선택자
export const selectDebugInfo = (state: GameState) => {
    return {
        turn: state.turn,
        activePlayer: state.activePlayer,
        actionsRemaining: state.turnState?.actionsRemaining,
        piecesCount: Object.keys(state.pieces).length,
        moveState: state.moveState,
        actionLogLength: state.actionLog.length,
    };
};
