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

        // BoardRenderer 인스턴스 생성 및 보드판 렌더링
        this.boardRenderer = new BoardRenderer(this, this.boardConfig);
        this.boardRenderer.renderBoard();
        this.events.on("tileClicked", this.moveTestPiece, this);

        // 말 기물 생성 및 Scene에 추가
        Test.testPiece = new Piece(this, 600, 300, { sun: 2, moon: 5, move: 5, star: 3 });
    }

    moveTestPiece(tile: TriangleTile) {
        Test.testPiece?.move(tile.x, tile.y);
    }

    update() {
        // 게임 로직 업데이트
    }
}
