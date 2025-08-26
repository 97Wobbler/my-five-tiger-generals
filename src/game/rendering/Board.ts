import { Scene } from "phaser";
import { UpAndDownTriangleTile } from "./TriangleTile";
import { LeftTriangleTile } from "./TriangleTile";
import { RightTriangleTile } from "./TriangleTile";

export class Board extends Phaser.GameObjects.Container {
    private readonly grid = { columns: 5, rows: 6 };
    static readonly triangle = {
        width: 150,
        height: 100,
        gap: 5,
        alpha: 0.5,
        color: 0xffffff,
        strokeStyle: {
            width: 2,
            color: 0x000000,
            alpha: 0.5,
        },
    };

    private cachedValues?: {
        inradius: number;
        scale: number;
    };

    private boardWidth: number = 0;
    private boardHeight: number = 0;

    constructor(scene: Scene) {
        super(scene);
        scene.add.existing(this);

        this.initializeCachedValues();

        // 전체 보드 크기 계산 (좌/우 보조 삼각형 포함: 가로 3W, 세로 6H)
        const W = Board.triangle.width;
        const H = Board.triangle.height;
        this.boardWidth = 3 * W;
        this.boardHeight = 6 * H;

        this.setSize(this.boardWidth, this.boardHeight);
        this.setPosition(scene.cameras.main.centerX, scene.cameras.main.centerY);
    }

    private initializeCachedValues() {
        const inradius = getInradius(Board.triangle.width, Board.triangle.height);
        const scale = getScaleForGap(Board.triangle.width, Board.triangle.height, Board.triangle.gap);

        this.cachedValues = {
            inradius,
            scale,
        };
    }

    public renderBoard() {
        this.removeAll(true);
        this.renderUpAndDownTiles();
        this.renderLeftAndRightTiles();

        // 실제 렌더된 자식들의 경계를 기준으로 컨테이너를 카메라 중앙에 정확히 정렬
        const cam = this.scene.cameras.main;
        const bounds = this.getBounds();
        const dx = cam.centerX - (bounds.x + bounds.width / 2);
        const dy = cam.centerY - (bounds.y + bounds.height / 2);
        this.setPosition(this.x + dx, this.y + dy);
    }

    private renderUpAndDownTiles() {
        const { inradius, scale } = this.cachedValues!;

        const startX = -this.boardWidth / 2;
        const startY = -this.boardHeight / 2;

        const total = this.grid.columns * this.grid.rows;
        for (let i = 0; i < total; i++) {
            const row = Math.floor(i / this.grid.columns);
            const col = i % this.grid.columns;
            const isEven = i % 2 === 0;

            const h = Board.triangle.height;
            const w = Board.triangle.width;

            const x = startX + col * (w / 2);
            const y = startY + row * h;

            const offsetY = h / 2 - inradius;

            const x0 = x;
            const y0 = y + (isEven ? offsetY : -offsetY);

            const verts = isEven ? [0, h / 2 + inradius, w, h / 2 + inradius, w / 2, -h / 2 + inradius] : [0, offsetY, w, offsetY, w / 2, h + offsetY];
            const params = [this.scene, x0, y0, verts, i, scale] as [Phaser.Scene, number, number, number[], number, number];

            const tile = new UpAndDownTriangleTile(...params);
            this.add(tile as unknown as Phaser.GameObjects.GameObject);
        }
    }

    private renderLeftAndRightTiles() {
        const { scale } = this.cachedValues!;

        const startX = -this.boardWidth / 2;
        const startY = -this.boardHeight / 2;

        const row2_3CenterY = startY + 1.5 * Board.triangle.height;
        const row4_5CenterY = startY + 3.5 * Board.triangle.height;

        const leftEndX = startX - Board.triangle.width / 2;
        const rightEndX = startX + this.boardWidth - Board.triangle.width / 2;

        // 왼쪽 끝 삼각형들 렌더링
        this.add(new RightTriangleTile(this.scene, leftEndX, row2_3CenterY, 30, scale) as unknown as Phaser.GameObjects.GameObject);
        this.add(new RightTriangleTile(this.scene, leftEndX, row4_5CenterY, 31, scale) as unknown as Phaser.GameObjects.GameObject);

        // 오른쪽 끝 삼각형들 렌더링
        this.add(new LeftTriangleTile(this.scene, rightEndX, row2_3CenterY, 32, scale) as unknown as Phaser.GameObjects.GameObject);
        this.add(new LeftTriangleTile(this.scene, rightEndX, row4_5CenterY, 33, scale) as unknown as Phaser.GameObjects.GameObject);
    }
}

function getInradius(b: number, h: number): number {
    const side = Math.sqrt(h * h + (b / 2) * (b / 2));
    return (b * h) / (b + 2 * side);
}

function getScaleForGap(b: number, h: number, G: number): number {
    const r = getInradius(b, h);
    return Math.max(0, 1 - G / (2 * r)); // 0 < s < 1 권장
}
