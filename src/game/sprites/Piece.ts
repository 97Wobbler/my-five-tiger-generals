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

    private piece: GameObjects.GameObject | null = null;
    private shadow: GameObjects.GameObject | null = null;

    private character: GameObjects.GameObject | null = null;
    private characterOutline: GameObjects.GameObject | null = null;

    // 능력치 표시를 위한 그래픽 객체들
    private statGraphics: GameObjects.Graphics | null = null;
    private statTexts: GameObjects.Text[] = [];

    constructor(scene: Scene, x: number, y: number, stats: PieceStats, isGeneral: boolean = true) {
        super(scene, x, y);

        this.stats = stats;
        this.isGeneral = isGeneral;

        this.createPiece();
        this.scene.add.existing(this);
    }

    private createPiece() {
        // 말의 시각적 표현 생성 (원형으로 표시)
        this.shadow = this.scene.add.circle(0, 2, 102, 0x000000).setAlpha(0.2);
        this.piece = this.scene.add.circle(0, 0, 100, 0xfafafa).setStrokeStyle(1, 0x000000, 0.4);
        this.character = this.scene.add.circle(0, 0, 65, 0xcccccc).setStrokeStyle(1, 0x000000, 0.4);
        this.characterOutline = this.scene.add.circle(0, 0, 70, 0xffffff).setStrokeStyle(1, 0x000000, 0.5);

        // 능력치 표시를 위한 그래픽 객체 생성
        this.statGraphics = this.scene.add.graphics();

        this.add(this.shadow);
        this.add(this.piece);
        this.add(this.characterOutline);
        this.add(this.character);
        this.add(this.statGraphics);

        // 능력치 표시
        this.displayStats();
    }

    private displayStats() {
        if (!this.statGraphics) return;

        this.statGraphics.clear();

        // 기존 텍스트 제거
        this.statTexts.forEach((text) => text.destroy());
        this.statTexts = [];

        const centerRadius = 85; // 능력치가 표시될 테두리 반지름
        const iconSize = 6; // 아이콘(원)의 크기
        const iconSpacing = 18; // 아이콘 간 간격

        // 각 능력치별 색상 정의
        const statColors: Record<keyof PieceStats, number> = {
            star: 0xffd700, // 별 - 금색
            moon: 0x87ceeb, // 달 - 하늘색
            sun: 0xffa500, // 해 - 주황색
            move: 0x32cd32, // 발 - 초록색
        };

        // 능력치별 위치와 각도 정의 (시계 방향)
        const statPositions = [
            { stat: "star", angle: -90 }, // 위쪽 (0도)
            { stat: "sun", angle: 0 }, // 우측 (90도)
            { stat: "move", angle: 90 }, // 아래쪽 (180도)
            { stat: "moon", angle: 180 }, // 좌측 (270도)
        ];

        statPositions.forEach(({ stat, angle }) => {
            const statKey = stat as keyof PieceStats;
            const value = this.stats[statKey];
            if (value <= 0) return;

            const color = statColors[statKey];
            const radians = (angle * Math.PI) / 180;

            // 아이콘들을 배치할 총 너비 계산
            const totalWidth = (value - 1) * iconSpacing;
            const startOffset = -totalWidth / 2;

            // 각 아이콘을 배치
            for (let i = 0; i < value; i++) {
                const offset = startOffset + i * iconSpacing;

                // 아이콘의 실제 위치 계산 (원형 테두리를 따라)
                const iconRadius = centerRadius;
                const iconAngle = radians + offset / iconRadius;
                const iconX = Math.cos(iconAngle) * iconRadius;
                const iconY = Math.sin(iconAngle) * iconRadius;

                // 작은 원으로 아이콘 그리기
                this.statGraphics?.fillStyle(color, 1);
                this.statGraphics?.fillCircle(iconX, iconY, iconSize);

                // 테두리 추가 (선명하게 보이도록)
                this.statGraphics?.lineStyle(1, 0x000000, 0.8);
                this.statGraphics?.strokeCircle(iconX, iconY, iconSize);
            }
        });

        console.log(`말 생성: 해${this.stats.sun} 달${this.stats.moon} 발${this.stats.move} 별${this.stats.star}`);
    }

    // 능력치 업데이트 메서드
    public updateStats(newStats: Partial<PieceStats>) {
        this.stats = { ...this.stats, ...newStats };
        this.displayStats();
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
