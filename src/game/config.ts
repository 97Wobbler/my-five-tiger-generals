import { MainScene } from "./scenes/MainScene";

export const gameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 800,
    parent: "game-container",
    backgroundColor: "#ffffff",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1000,
        height: 800,
    },
    scene: [MainScene],
};
