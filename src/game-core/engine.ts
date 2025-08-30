import type { Action, ApplyResult, DirectionLine, GameState, MoveState, PieceId, TileId, TurnState } from "./types";
import { Player } from "./types";

export function applyAction(state: GameState, action: Action): ApplyResult {
    // 공통: 턴/행동 검증
    const validation = validateTurnAndAction(state, action);
    if (!validation.ok) return validation;

    const working: GameState = { ...state };
    // 액션 적용
    switch (action.type) {
        case "MoveStart":
            return applyMoveStart(working, action.pieceId);
        case "MoveStep":
            return applyMoveStep(working, action.pieceId, action.to);
        case "MoveEnd":
            return applyMoveEnd(working, action.pieceId);
        case "Attack":
            return applyAttack(working, action.attackerId, action.defenderId, action.mode);
        case "Disengage":
            return applyDisengage(working, action.pieceId, action.to);
        case "Knock":
            return applyKnock(working, action.pieceId);
        case "UseTactic":
            // 전술 상세 로직은 별도 모듈로 분리 예정
            return consumeActionAndLog(working, action, true);
        case "Pass":
            return consumeActionAndLog(working, action, true);
        default:
            return { ok: false, code: "ILLEGAL_MOVE", reason: "Unknown action" };
    }
}

export function canMoveToNeighbor(state: GameState, pieceId: PieceId, to: TileId): boolean {
    const piece = state.pieces[pieceId];
    if (!piece) return false;
    const neighbors = state.board.adjacency[piece.tile] || [];
    return neighbors.includes(to);
}

export function isPlayersTurn(state: GameState, player: Player): boolean {
    return state.activePlayer === player;
}
// ===== 내부 유틸 =====

function validateTurnAndAction(state: GameState, action: Action): ApplyResult | { ok: true } {
    const turn: TurnState = state.turnState ?? { actionsRemaining: 2, lastActionByPiece: {}, usedTacticThisTurn: false };
    // 턴 주체 확인: piece 기반 액션은 말의 소유주가 현재 activePlayer인지 확인
    const actorOwner = getActionOwner(state, action);
    if (actorOwner && actorOwner !== state.activePlayer) {
        return { ok: false, code: "NOT_YOUR_TURN", reason: "It is not your turn" };
    }
    if (turn.actionsRemaining <= 0) {
        return { ok: false, code: "OUT_OF_TURNS", reason: "No actions remaining" };
    }
    // 동일 말 동일 행동 금지(턴 내) - MoveStart만 체크
    if (actorOwner && ["MoveStart", "Attack", "Knock", "Disengage"].includes(action.type)) {
        const pieceId = getActionPieceId(action);
        if (pieceId) {
            const history = state.turnState?.lastActionByPiece?.[pieceId] ?? [];
            const normalized = normalizeActionType(action.type);
            if (history.includes(normalized)) {
                return { ok: false, code: "SAME_PIECE_REPEAT", reason: "Same piece cannot perform same action twice in a turn" };
            }
        }
    }
    return { ok: true };
}

export function normalizeActionType(t: Action["type"]): "Move" | "Attack" | "Knock" | "Disengage" {
    if (t === "MoveStart") return "Move";
    if (t === "MoveStep" || t === "MoveEnd") return "Move";
    return t as "Move" | "Attack" | "Knock" | "Disengage";
}

function getActionPieceId(action: Action): PieceId | undefined {
    switch (action.type) {
        case "MoveStart":
        case "MoveStep":
        case "MoveEnd":
        case "Disengage":
        case "Knock":
            return action.pieceId;
        case "Attack":
            return action.attackerId;
        default:
            return undefined;
    }
}

function getActionOwner(state: GameState, action: Action): Player | undefined {
    const pid = getActionPieceId(action);
    if (!pid) return undefined;
    return state.pieces[pid]?.owner;
}

function consumeActionAndLog(state: GameState, action: Action, endTurnCheck: boolean): ApplyResult {
    const next = decrementActions(state, action);
    return maybeEndTurn(next, endTurnCheck);
}

function decrementActions(state: GameState, action: Action): GameState {
    const turn: TurnState = state.turnState ?? { actionsRemaining: 2, lastActionByPiece: {}, usedTacticThisTurn: false };
    const pieceId = getActionPieceId(action);
    const norm = pieceId ? normalizeActionType(action.type) : undefined;

    const updatedTurn: TurnState = {
        ...turn,
        actionsRemaining: Math.max(0, turn.actionsRemaining - 1),
        lastActionByPiece: {
            ...(turn.lastActionByPiece ?? {}),
            ...(pieceId && norm
                ? {
                      [pieceId]: [...(turn.lastActionByPiece?.[pieceId] ?? []), norm],
                  }
                : {}),
        },
    };

    return {
        ...state,
        turnState: updatedTurn,
        actionLog: [...state.actionLog, action],
    };
}

function maybeEndTurn(state: GameState, endTurnCheck: boolean): ApplyResult {
    console.log("[debug] maybeEndTurn called with endTurnCheck:", endTurnCheck);
    console.log("[debug] current actionsRemaining:", state.turnState?.actionsRemaining);
    console.log("[debug] current activePlayer:", state.activePlayer);

    if (!endTurnCheck) return { ok: true, next: state };
    const turn = state.turnState ?? { actionsRemaining: 0 };
    if ((turn.actionsRemaining ?? 0) > 0) {
        console.log("[debug] actions remaining > 0, not ending turn");
        return { ok: true, next: state };
    }

    console.log("[debug] ending turn, switching from", state.activePlayer, "to", state.activePlayer === Player.A ? Player.B : Player.A);

    // 턴 종료 및 교대
    const nextPlayer: Player = state.activePlayer === Player.A ? Player.B : Player.A;
    const nextState: GameState = {
        ...state,
        turn: state.turn + 1,
        activePlayer: nextPlayer,
        turnState: { actionsRemaining: 2, lastActionByPiece: {}, usedTacticThisTurn: false },
        moveState: undefined, // 이동 중이었다면 턴 종료와 함께 이동도 종료
    };
    return { ok: true, next: nextState };
}

// ===== 이동 구현 =====

function applyMoveStart(state: GameState, pieceId: PieceId): ApplyResult {
    const piece = state.pieces[pieceId];
    if (!piece) return { ok: false, code: "ILLEGAL_MOVE", reason: "Piece not found" };

    // MoveState 초기화를 더 명확하게
    const moveState: MoveState = {
        pieceId,
        remainingMoves: piece.stats.move,
        path: [piece.tile], // 시작 위치
        started: true,
        currentStep: 0,
        isAnimating: false,
        hasMoved: false, // 초기값: 아직 이동하지 않음
    };

    const next: GameState = {
        ...state,
        moveState,
    };

    // MoveStart는 행동력 소모
    return consumeActionAndLog(next, { type: "MoveStart", pieceId }, false);
}

function applyMoveStep(state: GameState, pieceId: PieceId, to: TileId): ApplyResult {
    const piece = state.pieces[pieceId];
    const moveState = state.moveState;
    if (!piece || !moveState || moveState.pieceId !== pieceId || !moveState.started) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Move not started or invalid state" };
    }

    if (moveState.remainingMoves <= 0) {
        return { ok: false, code: "OUT_OF_RANGE", reason: "No moves remaining" };
    }

    // 인접성 검증
    const neighbors = state.board.adjacency[piece.tile] || [];
    if (!neighbors.includes(to)) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Target not adjacent" };
    }

    // 적 점유 칸 진입 불가
    const occupant = getPieceOnTile(state, to);
    if (occupant && occupant.owner !== piece.owner) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Cannot enter enemy-occupied tile" };
    }

    // 이동력 감소 및 위치 업데이트 (음수 방지)
    const updatedPiece = { ...piece, tile: to };
    const updatedMoveState = {
        ...moveState,
        remainingMoves: Math.max(0, moveState.remainingMoves - 1), // 음수 방지
        path: [...moveState.path, to],
        currentStep: (moveState.currentStep ?? 0) + 1,
        hasMoved: true, // 한 칸이라도 이동했으므로 true
    };

    const next: GameState = {
        ...state,
        pieces: { ...state.pieces, [pieceId]: updatedPiece },
        moveState: updatedMoveState,
    };

    // 이동력 소진 시 자동 이동 종료 (안전한 체크)
    if (updatedMoveState.remainingMoves <= 0) {
        return applyMoveEnd(next, pieceId);
    }

    // MoveStep은 행동력 소모 안함, 보급 체크
    if (occupant && occupant.owner === piece.owner) {
        // 아군 칸 도달 = 보급 발생, 이동 종료
        return applySupply(next, pieceId);
    }

    return { ok: true, next };
}

function applyMoveEnd(state: GameState, pieceId: PieceId): ApplyResult {
    const moveState = state.moveState;
    if (!moveState || moveState.pieceId !== pieceId || !moveState.started) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Move not started or invalid state" };
    }

    // 이동 상태 정리
    const next: GameState = {
        ...state,
        moveState: undefined,
    };

    // MoveEnd는 행동력 소모 안함
    return { ok: true, next };
}

function applySupply(state: GameState, pieceId: PieceId): ApplyResult {
    // 보급 처리: 보급 장수를 supplyQueue에 추가
    const piece = state.pieces[pieceId];
    const players = state.players;
    const owner = piece.owner;
    const current = players[owner];

    const supplyItem = { pieceId, turnsUntilReturn: 1, reason: "supply" as const };
    const updatedOwner = { ...current, supplyQueue: [...current.supplyQueue, supplyItem] };

    const next: GameState = {
        ...state,
        players: { ...players, [owner]: updatedOwner },
        moveState: undefined, // 이동 종료
    };

    return { ok: true, next };
}

// ===== 행동 구현 =====

function applyAttack(state: GameState, attackerId: PieceId, defenderId: PieceId, mode: DirectionLine): ApplyResult {
    const attacker = state.pieces[attackerId];
    const defender = state.pieces[defenderId];
    if (!attacker || !defender) return { ok: false, code: "ILLEGAL_MOVE", reason: "Attacker or defender not found" };
    // 인접성(근접) 가정
    const neighbors = state.board.adjacency[attacker.tile] || [];
    if (!neighbors.includes(defender.tile)) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Defender not adjacent" };
    }

    let working: GameState = state;
    if (mode === "frontline") {
        // 전선: 피해 1을 수비측에 가하고 양측 교착
        working = applyDamage(working, defenderId, 1);
        // 교착 상태 설정 (단순화된 구조)
        working = {
            ...working,
            stalemate: {
                ...working.stalemate,
                [attackerId]: [...(working.stalemate?.[attackerId] ?? []), defenderId],
                [defenderId]: [...(working.stalemate?.[defenderId] ?? []), attackerId],
            },
        };
    } else {
        // 해/달: 능력치 비교 기반 피해 계산 (간단 버전)
        const atk = mode === "sun" ? attacker.stats.sun : attacker.stats.moon;
        const def = mode === "sun" ? defender.stats.sun : defender.stats.moon;
        const diff = atk - def;
        if (diff > 0) {
            working = applyDamage(working, defenderId, diff);
        } else if (diff < 0) {
            working = applyDamage(working, attackerId, -diff);
        } else {
            working = applyDamage(working, attackerId, 1);
            working = applyDamage(working, defenderId, 1);
        }
    }

    // 로그/턴 소모
    return consumeActionAndLog(working, { type: "Attack", attackerId, defenderId, mode }, true);
}

function applyDisengage(state: GameState, pieceId: PieceId, to: TileId): ApplyResult {
    const piece = state.pieces[pieceId];
    if (!piece) return { ok: false, code: "ILLEGAL_MOVE", reason: "Piece not found" };

    const neighbors = state.board.adjacency[piece.tile] || [];
    if (!neighbors.includes(to)) return { ok: false, code: "ILLEGAL_MOVE", reason: "Target not adjacent" };
    // 적 점유 칸 불가
    const occupant = getPieceOnTile(state, to);
    if (occupant && occupant.owner !== piece.owner) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Cannot enter enemy-occupied tile" };
    }

    // 교착 상태 검증
    if (!state.stalemate?.[pieceId] || state.stalemate[pieceId].length === 0) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Piece is not in stalemate" };
    }

    let working = applyDamage(state, pieceId, 2);
    // OUT 되었는지 확인 후 이동 처리
    const remaining = working.pieces[pieceId]?.troops ?? 0;
    if (remaining <= 0) {
        // OUT 처리 시 이동 실패로 간주하되 행동은 소모됨
        return consumeActionAndLog(working, { type: "Disengage", pieceId, to }, true);
    }

    const updatedPiece = { ...working.pieces[pieceId], tile: to };

    // 교착 상태 해제
    const opponentIds = working.stalemate?.[pieceId] ?? [];
    const newStalemate = { ...working.stalemate };

    // 현재 말의 교착 상태 제거
    delete newStalemate[pieceId];

    // 상대방들의 교착 상태에서도 현재 말 제거
    opponentIds.forEach((opponentId) => {
        if (newStalemate[opponentId]) {
            newStalemate[opponentId] = newStalemate[opponentId].filter((id) => id !== pieceId);
            if (newStalemate[opponentId].length === 0) {
                delete newStalemate[opponentId];
            }
        }
    });

    working = {
        ...working,
        pieces: { ...working.pieces, [pieceId]: updatedPiece },
        stalemate: Object.keys(newStalemate).length > 0 ? newStalemate : undefined,
    };

    return consumeActionAndLog(working, { type: "Disengage", pieceId, to }, true);
}

function applyKnock(state: GameState, pieceId: PieceId): ApplyResult {
    const piece = state.pieces[pieceId];
    if (!piece) return { ok: false, code: "ILLEGAL_MOVE", reason: "Piece not found" };
    const owner = piece.owner;
    const opponent: Player = owner === Player.A ? Player.B : Player.A;
    const endZone = state.board.endZoneByPlayer?.[opponent] ?? [];
    if (!endZone.includes(piece.tile)) {
        return { ok: false, code: "ILLEGAL_MOVE", reason: "Piece is not in opponent end zone" };
    }
    // 노크 카운트 +1
    const players = state.players;
    const current = players[owner];
    const updatedOwner = { ...current, knockCount: current.knockCount + 1 };
    const next: GameState = { ...state, players: { ...players, [owner]: updatedOwner } };
    return consumeActionAndLog(next, { type: "Knock", pieceId }, true);
}

function getPieceOnTile(state: GameState, tile: TileId) {
    const entries = Object.entries(state.pieces);
    for (const [, p] of entries) {
        if (p.tile === tile) return p;
    }
    return undefined;
}

function applyDamage(state: GameState, targetId: PieceId, amount: number): GameState {
    const target = state.pieces[targetId];
    if (!target || amount <= 0) return state;
    const before = target.troops;
    const after = Math.max(0, before - amount);
    const lost = before - after;

    // 묘지 누적
    const owner = target.owner;
    const players = state.players;
    const cur = players[owner];
    const updatedPlayer = { ...cur, graveyardTroops: cur.graveyardTroops + lost };

    // OUT 처리: 간단히 defeats+1, 타일 유지(상세 복귀 큐는 추후)
    const out = after === 0;
    const updatedTarget = { ...target, troops: after, defeats: out ? target.defeats + 1 : target.defeats };

    return {
        ...state,
        players: { ...players, [owner]: updatedPlayer },
        pieces: { ...state.pieces, [targetId]: updatedTarget },
    };
}
