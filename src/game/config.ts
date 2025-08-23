import { MainScene } from "./scenes/MainScene";

export const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#ffffff",
  scene: [MainScene],
};
