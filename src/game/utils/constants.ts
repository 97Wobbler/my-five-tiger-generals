// 게임판 관련 상수
export const BOARD_CONSTANTS = {
  TRIANGLE_COUNT: 34, // 총 삼각형 개수
  COLUMNS: 6, // 열 개수
  ROWS: 6, // 행 개수 (대략)
  TRIANGLE_SIZE: 60, // 삼각형 크기 (픽셀)
  GRID_SPACING: 2, // 그리드 간격
} as const;

// 말(말) 능력치 범위
export const PIECE_STATS_RANGE = {
  SUN: { min: 1, max: 3 }, // 해 (우측 전진 방향 공격력)
  MOON: { min: 1, max: 3 }, // 달 (좌측 전진 방향 공격력)
  MOVE: { min: 1, max: 5 }, // 발 (이동 가능한 칸 수)
  STAR: { min: 1, max: 5 }, // 별 (병력 수/통솔력)
} as const;

// 게임 진행 관련 상수
export const GAME_CONSTANTS = {
  ACTIONS_PER_TURN: 2, // 턴당 행동 수
  MAX_KNOCK_COUNT: 3, // 승리를 위한 노크 횟수
  BATTLE_DAMAGE: 1, // 기본 전투 피해
  RETREAT_DAMAGE: 2, // 회피 시 피해
} as const;

// 색상 팔레트
export const COLORS = {
  BACKGROUND: "#ffffff", // 배경색 (흰색)
  BORDER: "#000000", // 테두리색 (검은색)
  GENERAL_PIECE: "#8B4513", // 장수 말 색상 (갈색)
  STRATEGY_PIECE: "#4169E1", // 책략가 말 색상 (파란색)
  TRIANGLE: "#f0f0f0", // 삼각형 기본 색상
  TRIANGLE_HOVER: "#e0e0e0", // 삼각형 호버 색상
  TRIANGLE_SELECTED: "#d0d0d0", // 삼각형 선택 색상
} as const;
