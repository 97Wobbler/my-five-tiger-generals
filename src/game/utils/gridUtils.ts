/**
 * 2D 그리드 관련 공통 유틸리티 함수들
 */

/**
 * 좌표가 그리드 범위 내에 있는지 확인
 */
export function isValidPosition(row: number, col: number, rows: number, cols: number): boolean {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * ID로 아이템을 찾는 범용 함수
 */
export function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
    return items.find((item) => item.id === id);
}
