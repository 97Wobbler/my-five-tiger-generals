import React from "react";
import { useGameStore } from "../game-core/store";

// 좌측 UI - 선택된 말 정보
export const LeftPanel: React.FC = () => {
    return (
        <div className='left-panel'>
            <h3>선택된 말</h3>
            <p>말을 선택하면 여기에 정보가 표시됩니다.</p>
        </div>
    );
};

// 우측 UI - 경기 전반 정보 (세로 방향)
export const RightPanel: React.FC = () => {
    const gameState = useGameStore((state) => state.gameState);
    const turn = gameState.turn;
    const activePlayer = gameState.activePlayer;
    const actionsRemaining = gameState.turnState?.actionsRemaining ?? 2;

    return (
        <div className='right-panel'>
            <div className='game-overview'>
                <h3>경기 정보</h3>

                <div className='info-section'>
                    <div className='info-item'>
                        <span className='info-label'>현재 턴</span>
                        <span className='info-value turn-value'>{turn}</span>
                    </div>

                    <div className='info-item'>
                        <span className='info-label'>활성 플레이어</span>
                        <span className='info-value player-value'>{activePlayer}</span>
                    </div>

                    <div className='info-item'>
                        <span className='info-label'>남은 행동력</span>
                        <span className='info-value actions-value'>{actionsRemaining}/2</span>
                    </div>
                </div>

                <div className='game-status'>
                    <h4>게임 상태</h4>
                    <div className='status-item'>
                        <span className='status-label'>이동 중</span>
                        <span className='status-value'>{gameState.moveState ? "예" : "아니오"}</span>
                    </div>
                    {gameState.stalemate && (
                        <div className='status-item'>
                            <span className='status-label'>교착 상태</span>
                            <span className='status-value'>{Object.keys(gameState.stalemate).length}개</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 하단 UI - 에러 메시지만 표시
export const BottomPanel: React.FC = () => {
    const errorMessage = useGameStore((state) => state.errorMessage);

    return <div className='bottom-panel'>{errorMessage && <div className='error-message'>에러: {errorMessage}</div>}</div>;
};

// 상단 플레이어 상태 바 - 적 정보 (제한적 표시)
export const EnemyStatusBar: React.FC = () => {
    const gameState = useGameStore((state) => state.gameState);
    const activePlayer = useGameStore((state) => state.gameState.activePlayer);

    // 상대방 플레이어 정보
    const enemyPlayer = activePlayer === "A" ? "B" : "A";
    const enemyStatus = gameState.players[enemyPlayer];

    return (
        <div className='enemy-status'>
            <div className='enemy-basic-info'>
                <span className='enemy-label'>적 플레이어 {enemyPlayer}</span>
                <span className='enemy-knock'>노크: {enemyStatus.knockCount}/3</span>
                {enemyStatus.surrendered && <span className='enemy-surrendered'>항복!</span>}
            </div>
        </div>
    );
};

// 하단 플레이어 상태 바 - 내 정보 (상세 표시)
export const MyStatusBar: React.FC = () => {
    const gameState = useGameStore((state) => state.gameState);
    const activePlayer = useGameStore((state) => state.gameState.activePlayer);

    // 내 플레이어 정보
    const myStatus = gameState.players[activePlayer];

    return (
        <div className='my-status'>
            <div className='my-basic-info'>
                <span className='my-label'>내 플레이어 {activePlayer}</span>
                <span className='my-knock'>노크: {myStatus.knockCount}/3</span>
                {myStatus.surrendered && <span className='my-surrendered'>항복!</span>}
            </div>

            <div className='my-resources'>
                <div className='troop-resources'>
                    <span className='resource-label'>병력 자원:</span>
                    <span className='reserve-troops'>보유: {myStatus.reserveTroops}</span>
                    <span className='graveyard-troops'>묘지: {myStatus.graveyardTroops}</span>
                    <span className='supply-queue'>보급 대기: {myStatus.supplyQueue.length}</span>
                </div>

                <div className='tactic-resources'>
                    <span className='resource-label'>책략 자원:</span>
                    <span className='hand-cards'>손패: {myStatus.hand.length}장</span>
                    <span className='deck-cards'>덱: {myStatus.deckCount}장</span>
                    <span className='discard-cards'>버린 더미: {myStatus.discard.length}장</span>
                    <span className='equipped-tactics'>장착: {Object.keys(myStatus.equippedByPiece).length}개</span>
                    <span className='installables'>설치물: {myStatus.installableIds.length}개</span>
                </div>
            </div>

            {myStatus.statusEffects && myStatus.statusEffects.length > 0 && (
                <div className='status-effects'>
                    <span className='effects-label'>상태 효과:</span>
                    {myStatus.statusEffects.map((effect, index) => (
                        <span key={index} className='status-effect'>
                            {effect.key}
                            {effect.expiresOnTurn && ` (${effect.expiresOnTurn}턴)`}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// GameUI 네임스페이스로 export
const GameUI = {
    LeftPanel,
    RightPanel,
    EnemyStatusBar,
    MyStatusBar,
};

export default GameUI;
