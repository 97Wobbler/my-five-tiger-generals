import { Board } from "./Board";

export abstract class TriangleTile extends Phaser.GameObjects.Container {
    protected verts: number[];
    protected index: number;
    protected scaleValue: number;

    protected tri: Phaser.GameObjects.Triangle | null = null;
    protected text: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, verts: number[], index: number, scale: number) {
        super(scene, x, y);
        scene.add.existing(this);

        this.verts = verts;
        this.index = index;
        this.scaleValue = scale;

        this.draw();
        // this.markIndex();
        this.setupInteractivity();
    }

    protected draw() {
        // 로컬 좌표(0,0)를 기준으로 그린 뒤, 컨테이너 위치로 이동
        const tri = new Phaser.GameObjects.Triangle(this.scene, 0, 0, ...this.verts, Board.triangle.color, Board.triangle.alpha);
        tri.setScale(this.scaleValue);
        tri.setStrokeStyle(...Object.values(Board.triangle.strokeStyle));
        this.tri = tri;
        this.applyTransformations();
        this.add(tri);
    }

    protected abstract applyTransformations(): void;

    protected markIndex() {
        const label = new Phaser.GameObjects.Text(this.scene, 0, 0, `${this.index}`, { fontSize: "16px", color: "#000000" }).setOrigin(0.5, 0.5).setAlpha(0.2);
        this.text = label;
        this.add(label);
    }

    protected setupInteractivity() {
        if (!this.tri) return;

        const hit = new Phaser.Geom.Triangle(...this.verts);

        const triangle = this.tri;
        triangle.setInteractive(hit, Phaser.Geom.Triangle.Contains);

        if (triangle.input) {
            triangle.input.cursor = "pointer";
        }

        triangle.on("pointerover", () => this.onHoverEnter());
        triangle.on("pointerout", () => this.onHoverLeave());
        triangle.on("pointerdown", () => this.onClick());
    }

    protected onHoverEnter() {}

    protected onHoverLeave() {}

    protected onClick() {
        const mat = this.getWorldTransformMatrix();
        const world = new Phaser.Math.Vector2();
        mat.transformPoint(0, 0, world);
        this.scene.events.emit("tileClicked", {
            tileId: this.index,
            worldX: world.x,
            worldY: world.y,
        });
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
        const verts = [0, 0, 2 * Board.triangle.height, 0, Board.triangle.height, -Board.triangle.width / 2];
        super(scene, x, y, verts, index, scale);
    }

    protected applyTransformations(): void {
        if (this.tri) {
            this.tri.setDisplayOrigin(Board.triangle.height, 0);
            this.tri.setAngle(90);
        }
    }

    protected markIndex(): void {
        const label = new Phaser.GameObjects.Text(this.scene, 0, 0, `${this.index}`, { fontSize: "16px", color: "#000000" }).setOrigin(-1, 0.5).setAlpha(0.2);
        this.text = label;
        this.add(label);
    }
}

export class LeftTriangleTile extends TriangleTile {
    constructor(scene: Phaser.Scene, x: number, y: number, index: number, scale: number) {
        const verts = [0, 0, 2 * Board.triangle.height, 0, Board.triangle.height, -Board.triangle.width / 2];
        super(scene, x, y, verts, index, scale);
    }

    protected applyTransformations(): void {
        if (this.tri) {
            this.tri.setDisplayOrigin(Board.triangle.height, 0);
            this.tri.setAngle(270);
        }
    }

    protected markIndex(): void {
        const label = new Phaser.GameObjects.Text(this.scene, 0, 0, `${this.index}`, { fontSize: "16px", color: "#000000" }).setOrigin(2, 0.5).setAlpha(0.2);
        this.text = label;
        this.add(label);
    }
}
