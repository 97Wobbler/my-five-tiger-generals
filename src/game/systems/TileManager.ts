import type { BoardGraph, Tile } from "./BoardGraph";
import { isValidPosition, findById } from "../utils/gridUtils";

/**
 * 타일 데이터 조회와 게임 로직을 담당하는 매니저 클래스
 */
export class TileManager {
    constructor(private boardGraph: BoardGraph) {}

    /**
     * ID로 타일 조회
     */
    getTileById(id: number): Tile | undefined {
        return findById(this.boardGraph.tiles, id);
    }

    /**
     * 행/열 좌표로 타일 조회
     */
    getTileByRC(row: number, col: number): Tile | undefined {
        const id = this.boardGraph.rcToId(row, col);
        return id !== null ? this.getTileById(id) : undefined;
    }

    /**
     * 타일이 존재하는지 확인
     */
    hasTile(id: number): boolean {
        return this.getTileById(id) !== undefined;
    }

    /**
     * 타일이 유효한 좌표에 있는지 확인
     */
    isPositionValid(row: number, col: number): boolean {
        return isValidPosition(row, col, this.boardGraph.rows, this.boardGraph.cols);
    }

    /**
     * 모든 타일 ID 목록 반환
     */
    getAllTileIds(): number[] {
        return this.boardGraph.tiles.map((t) => t.id);
    }

    /**
     * 특정 방향의 타일들 조회
     */
    getTilesByOrientation(orient: string): Tile[] {
        return this.boardGraph.tiles.filter((t) => t.orient === orient);
    }

    /**
     * 보드 그래프 정보 반환
     */
    getBoardInfo() {
        return {
            rows: this.boardGraph.rows,
            cols: this.boardGraph.cols,
            totalTiles: this.boardGraph.tiles.length,
        };
    }

    /**
     * 내부 boardGraph에 접근 (디버깅 등 특수한 경우에만 사용)
     */
    getBoardGraph(): BoardGraph {
        return this.boardGraph;
    }
}
