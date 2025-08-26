import { MainScene } from "./scenes/MainScene";

export const gameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 1000,
    parent: "game-container",
    backgroundColor: "#ffffff",
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: [MainScene],
};
