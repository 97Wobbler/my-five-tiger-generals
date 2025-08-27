import type { BoardGraph, Tile } from "../systems/BoardGraph";
import { getNeighborsWithDir } from "../systems/BoardGraph";
import type { Board } from "../rendering/Board";
import { TileManager } from "../systems/TileManager";

export class BoardGraphDebugger {
    private scene: Phaser.Scene;
    private board: Board;
    private tileManager: TileManager;
    private debugGraphics: Phaser.GameObjects.Graphics;
    private debugTexts: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene, board: Board, boardGraph: BoardGraph) {
        this.scene = scene;
        this.board = board;
        this.tileManager = new TileManager(boardGraph);

        // 디버그 그래픽 객체 생성
        this.debugGraphics = scene.add.graphics();
        this.debugTexts = [];
    }

    /**
     * 타일 클릭 시 연결 관계 시각화
     */
    visualizeTileConnections(tileId: number): void {
        this.clearDebugInfo();

        const tile = this.tileManager.getTileById(tileId);
        if (!tile) return;

        // 변으로 연결된 이웃들 (파란색 원)
        this.visualizeSideConnections(tileId);

        // 꼭짓점으로만 연결된 이웃들 (빨간색 원)
        this.visualizeVertexConnections(tileId);

        // 클릭된 타일 자체를 녹색으로 표시
        this.visualizeSelectedTile(tile);
    }

    /**
     * 변으로 연결된 이웃들 시각화 (파란색 원)
     */
    private visualizeSideConnections(tileId: number): void {
        const sideNeighbors = getNeighborsWithDir(this.tileManager["boardGraph"], tileId, { allowVertexJump: false });

        sideNeighbors.forEach((neighbor) => {
            const neighborTile = this.tileManager.getTileById(neighbor.id);
            if (!neighborTile) return;

            const x = this.board.x + this.calculateTileWorldX(neighborTile.row, neighborTile.col);
            const y = this.board.y + this.calculateTileWorldY(neighborTile.row);

            // 파란색 원으로 표시
            this.debugGraphics.fillStyle(0x0066ff, 0.7);
            this.debugGraphics.fillCircle(x, y, 15);

            // 방향 정보 텍스트
            const text = this.scene.add
                .text(x, y, `${neighbor.id} - ${neighbor.dir}`, {
                    fontSize: "12px",
                    color: "#ffffff",
                    backgroundColor: "#0066ff",
                })
                .setOrigin(0.5);
            this.debugTexts.push(text);
        });
    }

    /**
     * 꼭짓점으로만 연결된 이웃들 시각화 (빨간색 원)
     */
    private visualizeVertexConnections(tileId: number): void {
        const allNeighbors = getNeighborsWithDir(this.tileManager.getBoardGraph(), tileId, { allowVertexJump: true });
        const sideNeighbors = getNeighborsWithDir(this.tileManager.getBoardGraph(), tileId, { allowVertexJump: false });
        const sideIds = new Set(sideNeighbors.map((n) => n.id));

        allNeighbors.forEach((neighbor) => {
            // 변으로 연결되지 않은 것만
            if (sideIds.has(neighbor.id)) return;

            const neighborTile = this.tileManager.getTileById(neighbor.id);
            if (!neighborTile) return;

            const x = this.board.x + this.calculateTileWorldX(neighborTile.row, neighborTile.col);
            const y = this.board.y + this.calculateTileWorldY(neighborTile.row);

            // 빨간색 원으로 표시
            this.debugGraphics.fillStyle(0xff0000, 0.7);
            this.debugGraphics.fillCircle(x, y, 15);

            // 방향 정보 텍스트
            const text = this.scene.add
                .text(x, y, `${neighbor.id} - ${neighbor.dir}`, {
                    fontSize: "12px",
                    color: "#ffffff",
                    backgroundColor: "#ff0000",
                })
                .setOrigin(0.5);
            this.debugTexts.push(text);
        });
    }

    /**
     * 선택된 타일 시각화 (녹색 원)
     */
    private visualizeSelectedTile(tile: Tile): void {
        const centerX = this.board.x + this.calculateTileWorldX(tile.row, tile.col);
        const centerY = this.board.y + this.calculateTileWorldY(tile.row);

        this.debugGraphics.fillStyle(0x00ff00, 0.8);
        this.debugGraphics.fillCircle(centerX, centerY, 20);

        // 클릭된 타일 정보 텍스트
        const infoText = this.scene.add
            .text(centerX, centerY - 50, `Selected: ${tile.id} (${tile.orient})`, {
                fontSize: "16px",
                color: "#000000",
                backgroundColor: "#ffffff",
            })
            .setOrigin(0.5);
        this.debugTexts.push(infoText);
    }

    /**
     * 디버그 정보 초기화
     */
    clearDebugInfo(): void {
        this.debugGraphics.clear();
        this.debugTexts.forEach((text) => text.destroy());
        this.debugTexts = [];
    }

    /**
     * 디버거 정리 (Scene 종료 시 호출)
     */
    destroy(): void {
        this.clearDebugInfo();
        this.debugGraphics.destroy();
    }

    /**
     * 타일의 월드 X 좌표 계산
     */
    private calculateTileWorldX(_row: number, col: number): number {
        const W = 150; // Board.triangle.width
        const startX = (-3 * W) / 2; // boardWidth / 2
        return startX + col * (W / 2);
    }

    /**
     * 타일의 월드 Y 좌표 계산
     */
    private calculateTileWorldY(row: number): number {
        const H = 100; // Board.triangle.height
        const startY = (-6 * H) / 2; // boardHeight / 2
        return startY + row * H;
    }
}
