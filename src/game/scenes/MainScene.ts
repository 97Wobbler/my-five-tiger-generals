import { Scene } from "phaser";
import { BoardRenderer } from "../rendering/BoardRenderer";
import type { BoardConfig } from "../rendering/BoardRenderer";
import { Piece } from "../sprites/Piece";
import type { TriangleTile } from "../rendering/TriangleTile";

const Test = {
    testPiece: null as Piece | null,
};

export class MainScene extends Scene {
    private boardConfig: BoardConfig = {
        startPosX: 100,
        startPosY: 100,
    };

    private boardRenderer?: BoardRenderer;

    constructor() {
        super({ key: "MainScene" });
    }

    preload() {
        // 게임 리소스 로드
        console.log("MainScene preload");
    }

    create() {
        this.cameras.main.setBackgroundColor("#f8f8f8");

        // BoardRenderer 인스턴스 생성 및 보드판 렌더링
        this.boardRenderer = new BoardRenderer(this, this.boardConfig);
        this.boardRenderer.renderBoard();

        // 말 기물 생성 및 Scene에 추가
        Test.testPiece = new Piece(this, 100, 100, { sun: 1, moon: 1, move: 1, star: 1 });

        this.events.on("tileClicked", this.moveTestPiece, this);
    }

    moveTestPiece(tile: TriangleTile) {
        Test.testPiece?.move(tile.x, tile.y);
    }

    update() {
        // 게임 로직 업데이트
    }
}
