import { Scene, GameObjects } from "phaser";

export interface PieceStats {
    sun: number; // 해 (우측 전진 방향 공격력 1-3)
    moon: number; // 달 (좌측 전진 방향 공격력 1-3)
    move: number; // 발 (이동 가능한 칸 수 1-5)
    star: number; // 별 (병력 수/통솔력 1-5)
}

export class Piece extends GameObjects.Container {
    private stats: PieceStats;
    private isGeneral: boolean; // 장수 말인지 책략가 말인지

    constructor(scene: Scene, x: number, y: number, stats: PieceStats, isGeneral: boolean = true) {
        super(scene, x, y);

        this.stats = stats;
        this.isGeneral = isGeneral;

        this.createPiece();
    }

    private createPiece() {
        // 말의 시각적 표현 생성 (원형으로 표시)
        const piece = this.scene.add.circle(0, 0, 20, this.isGeneral ? 0x8b4513 : 0x4169e1).setDepth(100);
        this.add(piece);

        this.scene.add.existing(this);

        // 능력치 표시 (나중에 구현)
        this.displayStats();
    }

    private displayStats() {
        // 능력치를 시각적으로 표시 (나중에 구현)
        console.log(`말 생성: 해${this.stats.sun} 달${this.stats.moon} 발${this.stats.move} 별${this.stats.star}`);
    }

    public getStats(): PieceStats {
        return { ...this.stats };
    }

    public isGeneralPiece(): boolean {
        return this.isGeneral;
    }

    public move(x: number, y: number) {
        this.setPosition(x, y);
    }
}
