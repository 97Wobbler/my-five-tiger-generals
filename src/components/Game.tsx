import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { gameConfig } from "../game/config";

const Game: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && !gameRef.current) {
            const container = containerRef.current;
            const config = {
                ...gameConfig,
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
                height: "800px",
                backgroundColor: "#ffffff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        />
    );
};

export default Game;
