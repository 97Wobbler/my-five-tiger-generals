import type { Action, GameState } from "./types";
import { Player } from "./types";
import { applyAction, canMoveToNeighbor, isPlayersTurn } from "./engine";

function createDummyState(): GameState {
    return {
        turn: 1,
        activePlayer: Player.A,
        players: {
            [Player.A]: {
                id: Player.A,
                knockCount: 0,
                reserveTroops: 30,
                graveyardTroops: 0,
                supplyQueue: [],
                hand: [],
                deckCount: 20,
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
                deckCount: 20,
                discard: [],
                equippedByPiece: {},
                installableIds: [],
            },
        },
        pieces: {
            p1: { id: "p1", owner: Player.A, tile: "t1", stats: { sun: 2, moon: 1, move: 2, star: 3 }, troops: 5, defeats: 0 },
            p2: { id: "p2", owner: Player.B, tile: "t3", stats: { sun: 1, moon: 2, move: 2, star: 3 }, troops: 5, defeats: 0 },
        },
        board: {
            adjacency: {
                t1: ["t2"],
                t2: ["t1", "t3"],
                t3: ["t2", "t4"],
                t4: ["t3"],
            },
        },
        actionLog: [],
        turnState: { actionsRemaining: 2, lastActionByPiece: {}, usedTacticThisTurn: false },
    };
}

function main() {
    const state = createDummyState();
    console.log("[smoke] start activePlayer", state.activePlayer);
    console.log("[smoke] can p1 move t1->t2?", canMoveToNeighbor(state, "p1", "t2"));
    console.log("[smoke] is A turn?", isPlayersTurn(state, Player.A));
    console.log("[smoke] initial actions remaining:", state.turnState?.actionsRemaining);

    // 1. MoveStart 테스트
    console.log("\n[smoke] === MoveStart 테스트 ===");
    const moveStart: Action = { type: "MoveStart", pieceId: "p1" };
    let res = applyAction(state, moveStart);
    if (!res.ok) {
        console.error("[smoke] MoveStart failed", res.code, res.reason);
        process.exit(1);
    }
    let nextState = res.next;
    console.log("[smoke] MoveStart 후 actions remaining:", nextState.turnState?.actionsRemaining);
    console.log("[smoke] moveState:", nextState.moveState);

    // 2. MoveStep 테스트
    console.log("\n[smoke] === MoveStep 테스트 ===");
    const moveStep: Action = { type: "MoveStep", pieceId: "p1", to: "t2" };
    res = applyAction(nextState, moveStep);
    if (!res.ok) {
        console.error("[smoke] MoveStep failed", res.code, res.reason);
        process.exit(1);
    }
    nextState = res.next;
    console.log("[smoke] MoveStep 후 actions remaining:", nextState.turnState?.actionsRemaining);
    console.log("[smoke] p2 위치:", nextState.pieces.p1.tile);
    console.log("[smoke] moveState remainingMoves:", nextState.moveState?.remainingMoves);

    // 3. MoveEnd 테스트
    console.log("\n[smoke] === MoveEnd 테스트 ===");
    const moveEnd: Action = { type: "MoveEnd", pieceId: "p1" };
    res = applyAction(nextState, moveEnd);
    if (!res.ok) {
        console.error("[smoke] MoveEnd failed", res.code, res.reason);
        process.exit(1);
    }
    nextState = res.next;
    console.log("[smoke] MoveEnd 후 moveState:", nextState.moveState);

    // 4. Attack 테스트 (전선)
    console.log("\n[smoke] === Attack 테스트 (전선) ===");
    const attack: Action = { type: "Attack", attackerId: "p1", defenderId: "p2", mode: "frontline" };
    res = applyAction(nextState, attack);
    if (!res.ok) {
        console.error("[smoke] Attack failed", res.code, res.reason);
        process.exit(1);
    }
    nextState = res.next;
    console.log("[smoke] Attack 후 actions remaining:", nextState.turnState?.actionsRemaining);
    console.log("[smoke] p2 병력:", nextState.pieces.p2.troops);
    console.log("[smoke] 교착 상태:", nextState.stalemate);

    // 5. Disengage 테스트
    console.log("\n[smoke] === Disengage 테스트 ===");
    const disengage: Action = { type: "Disengage", pieceId: "p2", to: "t4" };
    res = applyAction(nextState, disengage);
    if (!res.ok) {
        console.error("[smoke] Disengage failed", res.code, res.reason);
        process.exit(1);
    }
    nextState = res.next;
    console.log("[smoke] Disengage 후 p2 병력:", nextState.pieces.p1.troops);
    console.log("[smoke] p2 위치:", nextState.pieces.p1.tile);

    // 6. 턴 종료 테스트
    console.log("\n[smoke] === 턴 종료 테스트 ===");
    console.log("[smoke] 최종 actions remaining:", nextState.turnState?.actionsRemaining);
    console.log("[smoke] actionLog 길이:", nextState.actionLog.length);

    console.log("\n[smoke] 모든 테스트 통과! 🎉");
}

main();
