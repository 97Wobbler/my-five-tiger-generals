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
    private characterOutlines: GameObjects.GameObject[] = [];

    // 능력치 표시를 위한 그래픽 객체들
    private statGraphics: GameObjects.Graphics | null = null;
    private statIcons: GameObjects.GameObject[] = []; // 아이콘 이미지들을 저장할 배열

    constructor(scene: Scene, x: number, y: number, stats: PieceStats, isGeneral: boolean = true) {
        super(scene, x, y);

        this.stats = stats;
        this.isGeneral = isGeneral;

        const profileId = Math.floor(Math.random() * 7) + 1;

        this.createPiece(profileId);
        this.setScale(0.5);

        this.scene.add.existing(this);
    }

    private createPiece(profileId: number = 1) {
        // 말의 시각적 표현 생성 (원형으로 표시)
        this.shadow = this.scene.add.circle(1, 2, 102, 0x000000).setAlpha(0.2);
        this.piece = this.scene.add.circle(0, 0, 100, 0xfafafa).setStrokeStyle(1, 0x000000, 0.3);

        // 프로필 이미지 사용 (1-7번 중 선택)
        const profileKey = `profile-${Math.min(Math.max(profileId, 1), 7)}`;
        this.character = this.scene.add.image(0, 0, profileKey);

        this.characterOutlines.push(this.scene.add.circle(0, 0, 65, undefined).setStrokeStyle(1, 0x000000, 0.5));
        this.characterOutlines.push(this.scene.add.circle(0, 0, 70, undefined).setStrokeStyle(1, 0x000000, 0.5));

        // 능력치 표시를 위한 그래픽 객체 생성
        this.statGraphics = this.scene.add.graphics();

        this.add(this.shadow);
        this.add(this.piece);
        this.add(this.character);
        this.characterOutlines.forEach((outline) => this.add(outline));
        this.add(this.statGraphics);

        // 능력치 표시
        this.displayStats();
    }

    private displayStats() {
        if (!this.statGraphics) return;

        this.statGraphics.clear();

        this.statIcons.forEach((icon) => icon.destroy());
        this.statIcons = [];

        const centerRadius = 85; // 능력치가 표시될 테두리 반지름
        const innerRadius = 55; // 별(체력)이 표시될 안쪽 반지름
        const iconSize = 20; // 아이콘 크기
        const iconSpacing = 18; // 아이콘 간 간격

        // 로드된 이미지 키 사용
        const statIcons: Record<keyof PieceStats, string> = {
            star: "star-icon",
            moon: "moon-icon",
            sun: "sun-icon",
            move: "move-icon",
        };

        // 능력치별 위치와 각도 정의 (시계 방향)
        const statPositions = [
            { stat: "star", angle: -90, radius: innerRadius }, // 별 - 위쪽 안쪽
            { stat: "sun", angle: -45, radius: centerRadius }, // 해 - 우상단 대각선
            { stat: "moon", angle: -135, radius: centerRadius }, // 달 - 좌상단 대각선
            { stat: "move", angle: 90, radius: centerRadius }, // 발 - 아래쪽
        ];

        statPositions.forEach(({ stat, angle, radius }) => {
            const statKey = stat as keyof PieceStats;
            const value = this.stats[statKey];
            if (value <= 0) return;

            const iconKey = statIcons[statKey];
            const radians = (angle * Math.PI) / 180;

            // 아이콘들을 배치할 총 너비 계산
            const totalWidth = (value - 1) * iconSpacing;
            const startOffset = -totalWidth / 2;

            // 각 아이콘을 배치
            for (let i = 0; i < value; i++) {
                const offset = startOffset + i * iconSpacing;

                // 아이콘의 실제 위치 계산 (원형 테두리를 따라)
                const iconAngle = radians + offset / radius;
                const iconX = Math.cos(iconAngle) * radius;
                const iconY = Math.sin(iconAngle) * radius;

                // 로드된 이미지 키로 아이콘 추가
                const icon = this.scene.add.image(iconX, iconY, iconKey);
                icon.setScale(iconSize / 32); // 32x32 이미지 기준으로 스케일 조정
                icon.setOrigin(0.5);
                icon.setAngle(angle + 90);

                this.statIcons.push(icon);
                this.add(icon);
            }
        });
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
