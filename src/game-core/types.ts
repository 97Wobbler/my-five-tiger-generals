export enum Player {
    A = "A",
    B = "B",
}
export type TileId = string;
export type PieceId = string;

// 전투 방향/라인
export type DirectionLine = "sun" | "moon" | "frontline";

export type Stats = { sun: number; moon: number; move: number; star: number };

export type Piece = {
    id: PieceId;
    owner: Player;
    tile: TileId;
    stats: Stats;
    troops: number; // current troops (>= 0)
    defeats: number; // number of defeats (0..2)
};

export type BoardState = {
    adjacency: Record<TileId, TileId[]>;
    // 각 진영의 끝 칸(노크 가능 지역)
    endZoneByPlayer?: Record<Player, TileId[]>;
};

export type GameState = {
    turn: number;
    activePlayer: Player;
    pieces: Record<PieceId, Piece>;
    board: BoardState;
    actionLog: Action[];
    players: Record<Player, PlayerStatus>;
    // 선택: 교착 상태, 설치물, 턴 상태 등
    stalemate?: Record<PieceId, PieceId[]>; // pieceId -> 교착 상대방 ID 배열
    installables?: InstallableInstance[];
    turnState?: TurnState;
    moveState?: MoveState; // 현재 이동 중인 말의 상태
};

// 액션
export type Action =
    // 이동 관련
    | { type: "MoveStart"; pieceId: PieceId } // 이동 시작, 행동력 소모
    | { type: "MoveStep"; pieceId: PieceId; to: TileId } // 1칸 이동, 이동력 감소, 행동력 소모 안함
    | { type: "MoveEnd"; pieceId: PieceId } // 이동 종료(선택), 행동력 소모 안함
    // 전투
    | { type: "Attack"; attackerId: PieceId; defenderId: PieceId; mode: DirectionLine }
    // 노크(끝 칸 도달 상태에서만 가능)
    | { type: "Knock"; pieceId: PieceId }
    // 교착 이탈(이탈자 피해 2 규칙 적용 대상)
    | { type: "Disengage"; pieceId: PieceId; to: TileId }
    // 책략 사용(구체 타겟은 전술별 payload로 캡슐화)
    | { type: "UseTactic"; tactic: TacticKey; payload?: TacticPayload }
    // 행동 소진 없이 넘기기 등 확장 여지
    | { type: "Pass" };

export type ApplyResult =
    | { ok: true; next: GameState }
    | { ok: false; code: "ILLEGAL_MOVE" | "OUT_OF_TURNS" | "NOT_YOUR_TURN" | "SAME_PIECE_REPEAT" | "OUT_OF_RANGE"; reason: string };

// 턴/행동 상태
export type TurnState = {
    actionsRemaining: number; // 기본 2, 편달 사용 시 +1
    // 같은 말이 같은 행동을 2번 못하게 추적
    lastActionByPiece?: Record<PieceId, ("Move" | "Attack" | "Knock" | "Disengage")[]>;
    usedTacticThisTurn?: boolean; // 선택: 한 턴 1회 제한 등의 정책에 사용 가능
};

// 이동 상태 추적
export type MoveState = {
    pieceId: PieceId;
    remainingMoves: number; // 남은 이동력
    path: TileId[]; // 이동 경로
    started: boolean; // 이동 시작됨
    // UI 연출용 추가 필드
    isAnimating?: boolean; // 애니메이션 중인지
    currentStep?: number; // 현재 몇 번째 단계인지
    hasMoved: boolean; // 한 칸이라도 이동했는지 (취소/완료 버튼 표시용)
};

// 설치물/지속효과
export type InstallableType = "earthWall" | "watchtower" | "trap" | "bog";
export type InstallableInstance = {
    id: string;
    owner: Player;
    type: InstallableType;
    tile: TileId;
    hp?: number; // 내구도 등 (토벽/망루)
    attributes?: Record<string, number | string | boolean>;
};

// 책략(분류만 타입으로 정의; 개별 식별자는 키 문자열 사용)
export enum TacticCategory {
    INSTANT = "instant",
    EQUIPPED = "equipped",
    INSTALLABLE = "installable",
}
export type TacticKey = string; // 예: "일격", "불괴", "돌파", ... (총 20종)
export type TacticPayload =
    | { kind: "none" }
    | { kind: "piece"; pieceId: PieceId }
    | { kind: "tile"; tileId: TileId }
    | { kind: "line"; line: DirectionLine }
    | { kind: "multi"; pieces?: PieceId[]; tiles?: TileId[] }
    // 모병: 대상 말에 병력 보충 (묘지에서 최대 3단위, graveyardTroops 한도 내)
    | { kind: "recruit"; pieceId: PieceId; amount: TroopUnit };

// 로그/리플레이 이벤트 스키마(표준화)
export type DiceRoll = { sides: number; value: number; tag?: string };
export type EventBase = { id: string; turn: number; player: Player; timestamp?: number };
export type ActionEvent = EventBase & { type: "Action"; action: Action };
export type DamageEvent = EventBase & { type: "Damage"; target: PieceId; amount: number; source?: PieceId | InstallableType | "knock" };
export type OutEvent = EventBase & { type: "Out"; pieceId: PieceId; count: 1 | 2 };
export type ReturnEvent = EventBase & { type: "Return"; pieceId: PieceId; reason: "supply" | "out" };
export type InstallableEvent = EventBase & { type: "InstallableTick"; installableId: string; effect: string };
export type DiceEvent = EventBase & { type: "Dice"; roll: DiceRoll };
export type GraveyardEvent = EventBase & { type: "Graveyard"; player: Player; delta: number; reason: "loss" | "recruit" };
export type LogEvent = ActionEvent | DamageEvent | OutEvent | ReturnEvent | InstallableEvent | DiceEvent | GraveyardEvent;

// 플레이어 상태 (규칙서 기반)
export type TroopUnit = number; // 병력 1단위 = 1말 = 1만
export type SupplyQueueItem = { pieceId: PieceId; turnsUntilReturn: number; reason: "supply" | "out" };
export type EquippedMap = Record<PieceId, TacticKey[]>; // 장착형 책략 부착 현황
export type StatusEffect = {
    key: string; // 예: "교란", "불괴" 등
    target: { kind: "piece"; pieceId: PieceId } | { kind: "player" };
    expiresOnTurn?: number; // 만료 턴(선택)
    attributes?: Record<string, number | string | boolean>;
};

export type PlayerStatus = {
    id: Player;
    // 승리/진행
    knockCount: number; // 노크 누적
    surrendered?: boolean;

    // 병력 자원(병력판)
    reserveTroops: TroopUnit; // 기본 30에서 소모/회수
    graveyardTroops: TroopUnit; // 묘지(사망 병력 누적). 모병으로 최대 3단위까지 회수 가능
    supplyQueue: SupplyQueueItem[]; // 보급/OUT 복귀 대기

    // 책략 자원
    hand: TacticKey[]; // 현재 손패(시작 5장 무작위)
    deckCount: number; // 남은 덱 수(키 리스트를 모두 저장하지 않을 수 있음)
    discard: TacticKey[]; // 버린 더미
    equippedByPiece: EquippedMap; // 장착형 책략
    installableIds: string[]; // 소유 설치물 ID 목록
    usedTacticThisTurn?: boolean; // 턴당 1회 사용 제한 등의 정책에 사용

    // 상태 이상/버프
    statusEffects?: StatusEffect[]; // 예: 교란(행동 불가), 불괴(피해 면역)
};
