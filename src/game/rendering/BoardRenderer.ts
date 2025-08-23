import { Scene } from "phaser";
import { UpAndDownTriangleTile } from "./TriangleTile";
import { LeftTriangleTile } from "./TriangleTile";
import { RightTriangleTile } from "./TriangleTile";

export interface BoardConfig {
    startPosX: number;
    startPosY: number;
}

export class BoardRenderer {
    private readonly grid = { columns: 5, rows: 6 };
    static readonly triangle = {
        width: 150,
        height: 100,
        gap: 10,
        alpha: 0.5,
        color: 0xffffff,
        strokeStyle: {
            width: 2,
            color: 0x000000,
        },
    };

    private cachedValues?: {
        inradius: number;
        scale: number;
    };

    private scene: Scene;
    private startPosX: number;
    private startPosY: number;

    constructor(scene: Scene, config: BoardConfig) {
        this.scene = scene;
        this.startPosX = config.startPosX;
        this.startPosY = config.startPosY;
        this.initializeCachedValues();
    }

    private initializeCachedValues() {
        const inradius = getInradius(BoardRenderer.triangle.width, BoardRenderer.triangle.height);
        const scale = getScaleForGap(BoardRenderer.triangle.width, BoardRenderer.triangle.height, BoardRenderer.triangle.gap);

        this.cachedValues = {
            inradius,
            scale,
        };
    }

    public renderBoard() {
        this.renderUpAndDownTiles();
        this.renderLeftAndRightTiles();
    }

    private renderUpAndDownTiles() {
        const { inradius, scale } = this.cachedValues!;

        const total = this.grid.columns * this.grid.rows;
        for (let i = 0; i < total; i++) {
            const row = Math.floor(i / this.grid.columns);
            const col = i % this.grid.columns;
            const isEven = i % 2 === 0;

            const h = BoardRenderer.triangle.height;
            const w = BoardRenderer.triangle.width;

            const x = this.startPosX + col * (w / 2);
            const y = this.startPosY + row * h;

            const offsetY = h / 2 - inradius;

            const x0 = x;
            const y0 = y + (isEven ? offsetY : -offsetY);

            const verts = isEven ? [0, h / 2 + inradius, w, h / 2 + inradius, w / 2, -h / 2 + inradius] : [0, offsetY, w, offsetY, w / 2, h + offsetY];
            const params = [this.scene, x0, y0, verts, i, scale] as [Phaser.Scene, number, number, number[], number, number];

            new UpAndDownTriangleTile(...params);
        }
    }

    private renderLeftAndRightTiles() {
        const { scale } = this.cachedValues!;

        const row2_3CenterY = this.startPosY + 1.5 * BoardRenderer.triangle.height;
        const row4_5CenterY = this.startPosY + 3.5 * BoardRenderer.triangle.height;

        const leftEndX = this.startPosX - BoardRenderer.triangle.width / 2;
        const rightEndX = this.startPosX + this.grid.columns * (BoardRenderer.triangle.width / 2);

        // 왼쪽 끝 삼각형들 렌더링
        new RightTriangleTile(this.scene, leftEndX, row2_3CenterY, 30, scale);
        new RightTriangleTile(this.scene, leftEndX, row4_5CenterY, 31, scale);

        // 오른쪽 끝 삼각형들 렌더링
        new LeftTriangleTile(this.scene, rightEndX, row2_3CenterY, 32, scale);
        new LeftTriangleTile(this.scene, rightEndX, row4_5CenterY, 33, scale);
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
