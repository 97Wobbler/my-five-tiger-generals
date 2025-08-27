import { Scene } from "phaser";
import { Board } from "../rendering/Board";
import { Piece } from "../sprites/Piece";
import { buildBoardGraph, getNeighborsWithDir } from "../systems/BoardGraph";
import type { BoardGraph } from "../systems/BoardGraph";

const Test = {
    testPiece: null as Piece | null,
};

export class MainScene extends Scene {
    private board?: Board;
    private boardGraph?: BoardGraph;
    private debugGraphics?: Phaser.GameObjects.Graphics;
    private debugTexts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        // 게임 리소스 로드
        console.log("MainScene preload");

        // 아이콘 이미지들 미리 로드
        const base = import.meta.env.BASE_URL || "/";

        this.load.image("star-icon", `${base}images/icon/star.png`);
        this.load.image("moon-icon", `${base}images/icon/moon.png`);
        this.load.image("sun-icon", `${base}images/icon/sun.png`);
        this.load.image("move-icon", `${base}images/icon/move.png`);

        this.load.image("profile-1", `${base}images/profile/001.png`);
        this.load.image("profile-2", `${base}images/profile/002.png`);
        this.load.image("profile-3", `${base}images/profile/003.png`);
        this.load.image("profile-4", `${base}images/profile/004.png`);
        this.load.image("profile-5", `${base}images/profile/005.png`);
        this.load.image("profile-6", `${base}images/profile/006.png`);
        this.load.image("profile-7", `${base}images/profile/007.png`);
    }

    create() {
        this.cameras.main.setBackgroundColor("#f8f8f8");

        // 보드 컨테이너 생성(컨테이너 내부 로컬좌표로 중앙 기준 배치)
        this.board = new Board(this);
        this.board.renderBoard();
        this.events.on("tileClicked", this.onTileClicked, this);

        // 보드 그래프 초기화
        this.boardGraph = buildBoardGraph();

        // 디버그 그래픽 객체 생성
        this.debugGraphics = this.add.graphics();
        this.debugTexts = [];

        // 말 기물 생성 및 Scene에 추가
        // Test.testPiece = new Piece(this, 600, 300, { sun: 2, moon: 5, move: 5, star: 3 });
    }

    private onTileClicked(pos: { x: number; y: number }) {
        // 이전 디버그 정보 지우기
        this.clearDebugInfo();

        // 클릭된 위치에서 가장 가까운 타일 ID 찾기
        const tileId = this.findClosestTileId(pos.x, pos.y);
        if (tileId === null) return;

        // 해당 타일의 연결 정보 시각화
        this.visualizeTileConnections(tileId);
    }

    private clearDebugInfo() {
        this.debugGraphics?.clear();
        this.debugTexts.forEach((text) => text.destroy());
        this.debugTexts = [];
    }

    private findClosestTileId(worldX: number, worldY: number): number | null {
        if (!this.boardGraph) return null;

        // 각 타일의 위치를 계산하여 가장 가까운 타일 찾기
        let closestId = null;
        let minDistance = Infinity;

        for (const tile of this.boardGraph.tiles) {
            const tileWorldX = this.board!.x + this.calculateTileWorldX(tile.row, tile.col);
            const tileWorldY = this.board!.y + this.calculateTileWorldY(tile.row);

            const distance = Math.sqrt(Math.pow(worldX - tileWorldX, 2) + Math.pow(worldY - tileWorldY, 2));

            if (distance < minDistance) {
                minDistance = distance;
                closestId = tile.id;
            }
        }

        return closestId;
    }

    private calculateTileWorldX(_row: number, col: number): number {
        // Board의 로컬 좌표 계산 로직과 일치해야 함
        const W = 150; // Board.triangle.width
        const startX = (-3 * W) / 2; // boardWidth / 2
        return startX + col * (W / 2);
    }

    private calculateTileWorldY(row: number): number {
        const H = 100; // Board.triangle.height
        const startY = (-6 * H) / 2; // boardHeight / 2
        return startY + row * H;
    }

    private visualizeTileConnections(tileId: number) {
        if (!this.boardGraph || !this.debugGraphics) return;

        const tile = this.boardGraph.tiles.find((t) => t.id === tileId);
        if (!tile) return;

        // 변으로 연결된 이웃들 (파란색 원)
        const sideNeighbors = getNeighborsWithDir(this.boardGraph, tileId, { allowVertexJump: false });
        sideNeighbors.forEach((neighbor) => {
            const neighborTile = this.boardGraph!.tiles.find((t) => t.id === neighbor.id);
            if (neighborTile) {
                const x = this.board!.x + this.calculateTileWorldX(neighborTile.row, neighborTile.col);
                const y = this.board!.y + this.calculateTileWorldY(neighborTile.row);

                // 파란색 원으로 표시
                this.debugGraphics!.fillStyle(0x0066ff, 0.7);
                this.debugGraphics!.fillCircle(x, y, 15);

                // 방향 정보 텍스트
                const text = this.add
                    .text(x, y, `${neighbor.id} - ${neighbor.dir}`, {
                        fontSize: "12px",
                        color: "#ffffff",
                        backgroundColor: "#0066ff",
                    })
                    .setOrigin(0.5);
                this.debugTexts.push(text);
            }
        });

        // 꼭짓점으로만 연결된 이웃들 (빨간색 원)
        const vertexNeighbors = getNeighborsWithDir(this.boardGraph, tileId, { allowVertexJump: true });
        const sideIds = new Set(sideNeighbors.map((n) => n.id));

        vertexNeighbors.forEach((neighbor) => {
            if (!sideIds.has(neighbor.id)) {
                // 변으로 연결되지 않은 것만
                const neighborTile = this.boardGraph!.tiles.find((t) => t.id === neighbor.id);
                if (neighborTile) {
                    const x = this.board!.x + this.calculateTileWorldX(neighborTile.row, neighborTile.col);
                    const y = this.board!.y + this.calculateTileWorldY(neighborTile.row);

                    // 빨간색 원으로 표시
                    this.debugGraphics!.fillStyle(0xff0000, 0.7);
                    this.debugGraphics!.fillCircle(x, y, 15);

                    // 방향 정보 텍스트
                    const text = this.add
                        .text(x, y, `${neighbor.id} - ${neighbor.dir}`, {
                            fontSize: "12px",
                            color: "#ffffff",
                            backgroundColor: "#ff0000",
                        })
                        .setOrigin(0.5);
                    this.debugTexts.push(text);
                }
            }
        });

        // 클릭된 타일 자체를 녹색으로 표시
        const centerX = this.board!.x + this.calculateTileWorldX(tile.row, tile.col);
        const centerY = this.board!.y + this.calculateTileWorldY(tile.row);
        this.debugGraphics!.fillStyle(0x00ff00, 0.8);
        this.debugGraphics!.fillCircle(centerX, centerY, 20);

        // 클릭된 타일 정보 텍스트
        const infoText = this.add
            .text(centerX, centerY - 50, `Selected: ${tileId} (${tile.orient})`, {
                fontSize: "16px",
                color: "#000000",
                backgroundColor: "#ffffff",
            })
            .setOrigin(0.5);
        this.debugTexts.push(infoText);
    }

    moveTestPiece(pos: { x: number; y: number }) {
        Test.testPiece?.move(pos.x, pos.y);
    }

    update() {
        // 게임 로직 업데이트
    }
}
