import { Scene } from "phaser";
import { Board } from "../rendering/Board";
import { Piece } from "../sprites/Piece";

const Test = {
    testPiece: null as Piece | null,
};

export class MainScene extends Scene {
    private board?: Board;

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
        this.events.on("tileClicked", this.moveTestPiece, this);

        // 말 기물 생성 및 Scene에 추가
        Test.testPiece = new Piece(this, 600, 300, { sun: 2, moon: 5, move: 5, star: 3 });
    }

    moveTestPiece(pos: { x: number; y: number }) {
        Test.testPiece?.move(pos.x, pos.y);
    }

    update() {
        // 게임 로직 업데이트
    }
}
