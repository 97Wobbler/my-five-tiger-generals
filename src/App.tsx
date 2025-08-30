import Game from "./components/Game";
import GameUI from "./components/GameUI";
import "./App.css";

function App() {
    return (
        <div className='App'>
            {/* 상단 플레이어 상태 바 - 적 정보 */}
            <div className='player-status-bar enemy-bar'>
                <GameUI.EnemyStatusBar />
            </div>

            {/* 메인 게임 영역 */}
            <div className='main-game-area'>
                {/* 좌측 UI */}
                <div className='left-ui'>
                    <GameUI.LeftPanel />
                </div>

                {/* Phaser 게임판 */}
                <div className='game-board'>
                    <Game />
                </div>

                {/* 우측 UI */}
                <div className='right-ui'>
                    <GameUI.RightPanel />
                </div>
            </div>

            {/* 하단 플레이어 상태 바 - 내 정보 */}
            <div className='player-status-bar my-bar'>
                <GameUI.MyStatusBar />
            </div>
        </div>
    );
}

export default App;
