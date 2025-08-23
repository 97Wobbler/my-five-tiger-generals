import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { gameConfig } from "../game/config";

const Game: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      // 게임 컨테이너에 맞게 설정 조정
      const container = containerRef.current;
      const config = {
        ...gameConfig,
        width: container.clientWidth,
        height: container.clientHeight,
        parent: container,
      };

      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id='game-container'
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#ffffff",
      }}
    />
  );
};

export default Game;
