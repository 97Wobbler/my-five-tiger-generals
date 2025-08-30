import { create } from "zustand";
import type { GameState, Action, ApplyResult } from "../types";
import { Player } from "../types";
import { applyAction } from "../engine";

// 게임 스토어 상태 인터페이스
interface GameStoreState {
    // 게임 상태
    gameState: GameState;

    // UI 상태
    selectedPieceId: string | null;
    selectedAction: string | null;
    isMoving: boolean;
    errorMessage: string | null;

    // 액션들
    selectPiece: (pieceId: string | null) => void;
    selectAction: (action: string | null) => void;
    dispatchAction: (action: Action) => ApplyResult;
    resetSelection: () => void;
    setErrorMessage: (message: string | null) => void;

    // 게임 초기화
    initializeGame: (initialState?: Partial<GameState>) => void;
    resetGame: () => void;
}

// 초기 게임 상태 생성 함수
function createInitialGameState(): GameState {
    return {
        turn: 1,
        activePlayer: Player.A,
        pieces: {
            p1: {
                id: "p1",
                owner: Player.A,
                tile: "t1",
                stats: { sun: 2, moon: 1, move: 2, star: 3 },
                troops: 5,
                defeats: 0,
            },
            p2: {
                id: "p2",
                owner: Player.B,
                tile: "t3",
                stats: { sun: 1, moon: 2, move: 2, star: 3 },
                troops: 5,
                defeats: 0,
            },
        },
        board: {
            adjacency: {
                t1: ["t2"],
                t2: ["t1", "t3"],
                t3: ["t2", "t4"],
                t4: ["t3"],
            },
        },
        players: {
            [Player.A]: {
                id: Player.A,
                knockCount: 0,
                reserveTroops: 30,
                graveyardTroops: 0,
                supplyQueue: [],
                hand: [],
                deckCount: 0,
                discard: [],
                equippedByPiece: {},
                installableIds: [],
            },
            [Player.B]: {
                id: Player.B,
                knockCount: 0,
                reserveTroops: 30,
                graveyardTroops: 0,
                supplyQueue: [],
                hand: [],
                deckCount: 0,
                discard: [],
                equippedByPiece: {},
                installableIds: [],
            },
        },
        actionLog: [],
        turnState: {
            actionsRemaining: 2,
            lastActionByPiece: {},
            usedTacticThisTurn: false,
        },
    };
}

// 게임 스토어 생성
export const useGameStore = create<GameStoreState>((set, get) => ({
    // 초기 상태
    gameState: createInitialGameState(),
    selectedPieceId: null,
    selectedAction: null,
    isMoving: false,
    errorMessage: null,

    // 말 선택
    selectPiece: (pieceId: string | null) => {
        set({ selectedPieceId: pieceId });
        // 말 선택 시 자동으로 액션 선택 해제
        if (pieceId) {
            set({ selectedAction: null });
        }
    },

    // 액션 선택
    selectAction: (action: string | null) => {
        set({ selectedAction: action });
    },

    // 액션 디스패치
    dispatchAction: (action: Action) => {
        const { gameState } = get();
        const result = applyAction(gameState, action);

        if (result.ok && result.next) {
            // 성공한 액션의 경우 상태 업데이트
            set({
                gameState: result.next,
                errorMessage: null,
            });

            // 액션 완료 후 선택 상태 정리 (턴이 끝날 때만)
            // 턴이 끝나면 선택 상태를 초기화하지만, 턴 중에는 유지
            if (result.next?.turnState && result.next.turnState.actionsRemaining === 0) {
                set({
                    selectedPieceId: null,
                    selectedAction: null,
                });
            }
        } else {
            // 실패한 액션의 경우 에러 메시지 설정
            const errorMessage = result.ok === false ? result.reason : "알 수 없는 오류가 발생했습니다.";
            set({
                errorMessage,
            });
        }

        return result;
    },

    // 선택 상태 초기화
    resetSelection: () => {
        set({
            selectedPieceId: null,
            selectedAction: null,
            errorMessage: null,
        });
    },

    // 에러 메시지 설정
    setErrorMessage: (message: string | null) => {
        set({ errorMessage: message });
    },

    // 게임 초기화
    initializeGame: (initialState?: Partial<GameState>) => {
        const baseState = createInitialGameState();
        const newState = { ...baseState, ...initialState };
        set({
            gameState: newState,
            selectedPieceId: null,
            selectedAction: null,
            isMoving: false,
            errorMessage: null,
        });
    },

    // 게임 리셋
    resetGame: () => {
        get().initializeGame();
    },
}));
