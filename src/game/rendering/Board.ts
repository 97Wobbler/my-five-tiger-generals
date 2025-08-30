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
        color: 0xffff_ff,
        strokeStyle: {
            width: 2,
            color: 0x00_00_00,
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
        this.renderSunMoonIcons();

        // Phaser의 자동 중앙 정렬을 활용하므로 추가 위치 조정 불필요
        // this.setPosition()는 생성자에서 이미 설정됨
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

            const y0 = y + (isEven ? offsetY : -offsetY);

            const verts = isEven ? [0, h / 2 + inradius, w, h / 2 + inradius, w / 2, -h / 2 + inradius] : [0, offsetY, w, offsetY, w / 2, h + offsetY];
            const params = [this.scene, x, y0, verts, i, scale] as [Phaser.Scene, number, number, number[], number, number];

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

    private renderSunMoonIcons() {
        /** 해 아이콘 (우측 전진 방향) */
        // 1행 6열 (r: 0, c: 5) - 오른쪽 끝
        const sunRightPos = this.rcToCoordinate(0, 5, -1 / 4, -1 / 8);
        const sunRightX = sunRightPos.x;
        const sunRightY = sunRightPos.y;

        // 6행 0열 (r: 5, c: -1) - 왼쪽 끝
        const sunLeftPos = this.rcToCoordinate(5, -1, 1 / 4, 1 / 8);
        const sunLeftX = sunLeftPos.x;
        const sunLeftY = sunLeftPos.y;

        // 해 아이콘 렌더링 (빨간 점)
        const sunRight = this.scene.add.image(sunRightX, sunRightY, "sun-icon").setBlendMode(Phaser.BlendModes.MULTIPLY);
        const sunLeft = this.scene.add.image(sunLeftX, sunLeftY, "sun-icon").setBlendMode(Phaser.BlendModes.MULTIPLY);

        /** 달 아이콘 (좌측 전진 방향) */
        // 1행 0열 (r: 0, c: -1) - 왼쪽 끝
        const moonLeftPos = this.rcToCoordinate(0, -1, -1 / 4, 1 / 8);
        const moonLeftX = moonLeftPos.x;
        const moonLeftY = moonLeftPos.y;

        // 6행 6열 (r: 5, c: 5) - 오른쪽 끝
        const moonRightPos = this.rcToCoordinate(5, 5, 1 / 4, -1 / 8);
        const moonRightX = moonRightPos.x;
        const moonRightY = moonRightPos.y;

        // 달 아이콘 렌더링 (파란 점)
        const moonLeft = this.scene.add.image(moonLeftX, moonLeftY, "moon-icon").setBlendMode(Phaser.BlendModes.MULTIPLY);
        const moonRight = this.scene.add.image(moonRightX, moonRightY, "moon-icon").setBlendMode(Phaser.BlendModes.MULTIPLY);

        // 가이드 라인 생성 (초기에는 숨김)
        const sunGuideLine = this.scene.add.graphics();
        const moonGuideLine = this.scene.add.graphics();

        // 해 방향 가이드 라인 (우측 전진 방향) - 왼쪽 상단에서 오른쪽 하단으로
        this.drawSunGuideLine(sunGuideLine);
        sunGuideLine.setVisible(false);

        // 달 방향 가이드 라인 (좌측 전진 방향) - 오른쪽 상단에서 왼쪽 하단으로
        this.drawMoonGuideLine(moonGuideLine);
        moonGuideLine.setVisible(false);

        // 해 아이콘들에 인터랙티브 설정
        this.setInteractiveWithGuide(sunRight, sunGuideLine);
        this.setInteractiveWithGuide(sunLeft, sunGuideLine);

        // 달 아이콘들에 인터랙티브 설정
        this.setInteractiveWithGuide(moonLeft, moonGuideLine);
        this.setInteractiveWithGuide(moonRight, moonGuideLine);

        // 아이콘들을 보드 컨테이너에 추가
        this.add(sunRight);
        this.add(sunLeft);
        this.add(moonLeft);
        this.add(moonRight);
        this.add(sunGuideLine);
        this.add(moonGuideLine);
    }

    private drawSunGuideLine(graphics: Phaser.GameObjects.Graphics) {
        graphics.lineStyle(20, 0x88_88_88, 0.3);
        graphics.beginPath();

        // 왼쪽 상단에서 오른쪽 하단으로 이어지는 대각선 경로
        // 삼각형 타일의 모서리를 따라가는 경로
        const points = [
            this.rcToCoordinate(0, 2, -1 / 2),
            this.rcToCoordinate(3, 5, -1 / 2),
            this.rcToCoordinate(0, 0, -1 / 2),
            this.rcToCoordinate(5, 5, -1 / 2),
            this.rcToCoordinate(1, -1, -1 / 2),
            this.rcToCoordinate(6, 4, -1 / 2),
            this.rcToCoordinate(3, -1, -1 / 2),
            this.rcToCoordinate(6, 2, -1 / 2),
        ];

        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            if (i % 2 === 0) {
                graphics.moveTo(points[i].x, points[i].y);
            } else {
                graphics.lineTo(points[i].x, points[i].y);
            }
        }
        graphics.strokePath();
    }

    private drawMoonGuideLine(graphics: Phaser.GameObjects.Graphics) {
        graphics.lineStyle(20, 0x88_88_88, 0.3);
        graphics.beginPath();

        // 오른쪽 상단에서 왼쪽 하단으로 이어지는 대각선 경로
        const points = [
            this.rcToCoordinate(0, 2, -1 / 2),
            this.rcToCoordinate(3, -1, -1 / 2),
            this.rcToCoordinate(0, 4, -1 / 2),
            this.rcToCoordinate(5, -1, -1 / 2),
            this.rcToCoordinate(1, 5, -1 / 2),
            this.rcToCoordinate(6, 0, -1 / 2),
            this.rcToCoordinate(3, 5, -1 / 2),
            this.rcToCoordinate(6, 2, -1 / 2),
        ];

        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            if (i % 2 === 0) {
                graphics.moveTo(points[i].x, points[i].y);
            } else {
                graphics.lineTo(points[i].x, points[i].y);
            }
        }
        graphics.strokePath();
    }

    private setInteractiveWithGuide(icon: Phaser.GameObjects.Image, guideLine: Phaser.GameObjects.Graphics) {
        icon.setInteractive();
        if (icon.input) {
            icon.input.cursor = "pointer";
        }

        icon.on("pointerover", () => {
            guideLine.setVisible(true);
        });

        icon.on("pointerout", () => {
            guideLine.setVisible(false);
        });

        icon.on("pointerdown", () => {});
    }

    /**
     * 행/열 좌표를 실제 픽셀 좌표로 변환
     * @param r 행 (0-5)
     * @param c 열 (-1 ~ 5, -1은 왼쪽 보조 삼각형, 5는 오른쪽 보조 삼각형)
     * @param offsetR 행 방향 오프셋 (-0.5 ~ 0.5)
     * @param offsetC 열 방향 오프셋 (-0.5 ~ 0.5)
     * @returns {x, y} 픽셀 좌표
     */
    private rcToCoordinate(r: number, c: number, offsetR: number = 0, offsetC: number = 0): { x: number; y: number } {
        const W = Board.triangle.width;
        const H = Board.triangle.height;
        const startX = -this.boardWidth / 2;
        const startY = -this.boardHeight / 2;

        const x: number = startX + c * (W / 2) + offsetC * W;
        const y: number = startY + r * H + offsetR * H;

        return { x, y };
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
