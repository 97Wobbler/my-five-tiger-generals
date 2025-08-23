import { BoardRenderer } from "./BoardRenderer";

export abstract class TriangleTile {
    public x: number;
    public y: number;

    protected scene: Phaser.Scene;
    protected verts: number[];
    protected index: number;
    protected scale: number;

    protected tri: Phaser.GameObjects.Triangle | null = null;
    protected text: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, verts: number[], index: number, scale: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.verts = verts;
        this.index = index;
        this.scale = scale;

        this.draw();
        this.markIndex();
        this.setupInteractivity();
    }

    protected draw() {
        this.tri = this.scene.add.triangle(this.x, this.y, ...this.verts, BoardRenderer.triangle.color, BoardRenderer.triangle.alpha);
        this.tri.setScale(this.scale);
        this.tri.setStrokeStyle(...Object.values(BoardRenderer.triangle.strokeStyle));
        this.applyTransformations();
    }

    protected abstract applyTransformations(): void;

    protected markIndex() {
        this.text = this.scene.add.text(this.x, this.y, `${this.index}`, { fontSize: "16px", color: "#000000" }).setOrigin(0.5, 0.5).setAlpha(0.2);
    }

    protected setupInteractivity() {
        if (!this.tri) return;

        // 커스텀 히트 영역 설정
        const hit = new Phaser.Geom.Triangle(...this.verts);

        const triangle = this.tri;
        triangle.setInteractive(hit, Phaser.Geom.Triangle.Contains);

        // input이 존재하는지 확인 후 cursor 설정
        if (triangle.input) {
            triangle.input.cursor = "pointer";
        }

        // 이벤트 핸들러 설정
        triangle.on("pointerover", () => this.onHoverEnter());
        triangle.on("pointerout", () => this.onHoverLeave());
        triangle.on("pointerdown", () => this.onClick());
    }

    protected onHoverEnter() {}

    protected onHoverLeave() {}

    protected onClick() {
        this.scene.events.emit("tileClicked", this);
    }

    destroy() {
        this.tri?.destroy();
        this.text?.destroy();
    }
}

export class UpAndDownTriangleTile extends TriangleTile {
    constructor(scene: Phaser.Scene, x: number, y: number, verts: number[], index: number, scale: number) {
        super(scene, x, y, verts, index, scale);
    }

    protected applyTransformations(): void {
        // 기본 변환 없음
    }
}

export class RightTriangleTile extends TriangleTile {
    constructor(scene: Phaser.Scene, x: number, y: number, index: number, scale: number) {
        const verts = [0, 0, 2 * BoardRenderer.triangle.height, 0, BoardRenderer.triangle.height, -BoardRenderer.triangle.width / 2];
        super(scene, x, y, verts, index, scale);
    }

    protected applyTransformations(): void {
        if (this.tri) {
            this.tri.setDisplayOrigin(BoardRenderer.triangle.height, 0);
            this.tri.setAngle(90);
        }
    }

    protected markIndex(): void {
        this.text = this.scene.add.text(this.x, this.y, `${this.index}`, { fontSize: "16px", color: "#000000" }).setOrigin(-1, 0.5).setAlpha(0.2);
    }
}

export class LeftTriangleTile extends TriangleTile {
    constructor(scene: Phaser.Scene, x: number, y: number, index: number, scale: number) {
        const verts = [0, 0, 2 * BoardRenderer.triangle.height, 0, BoardRenderer.triangle.height, -BoardRenderer.triangle.width / 2];
        super(scene, x, y, verts, index, scale);
    }

    protected applyTransformations(): void {
        if (this.tri) {
            this.tri.setDisplayOrigin(BoardRenderer.triangle.height, 0);
            this.tri.setAngle(270);
        }
    }

    protected markIndex(): void {
        this.text = this.scene.add.text(this.x, this.y, `${this.index}`, { fontSize: "16px", color: "#000000" }).setOrigin(2, 0.5).setAlpha(0.2);
    }
}
