import React, { useState } from 'react';
import { useTournament } from '../useTournament';
import { RegistrationPanel } from './RegistrationPanel';
import { ChapterMap } from './ChapterMap';
import { TrackSelection } from './TrackSelection';
import { LiveScoreboard } from './LiveScoreboard';
import { RankingBoard } from './RankingBoard';
import { TournamentResult } from './TournamentResult';

type TabId = 'register' | 'chapters' | 'tracks' | 'live' | 'ranking';

interface TournamentCenterProps {
  onClose: () => void;
  onStartTrack: (trackId: string) => void;
  lastResult: { trackId: string; score: number } | null;
  onClearResult: () => void;
}

export const TournamentCenter: React.FC<TournamentCenterProps> = ({
  onClose,
  onStartTrack,
  lastResult,
  onClearResult,
}) => {
  const tournament = useTournament();
  const [activeTab, setActiveTab] = useState<TabId>(
    tournament.state.status === 'idle' ? 'register' : 'chapters'
  );
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const isRegistered = tournament.state.status !== 'idle';
  const currentTrack = selectedTrackId ? tournament.getTrack(selectedTrackId) : null;
  const lastResultData = lastResult ? tournament.getTrackResult(lastResult.trackId) : null;
  const lastResultTrack = lastResult ? tournament.getTrack(lastResult.trackId) : null;

  const handleRegister = (playerName: string): boolean => {
    const success = tournament.register(playerName);
    if (success) {
      setActiveTab('chapters');
    }
    return success;
  };

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setActiveTab('tracks');
  };

  const handleStartTrack = (trackId: string) => {
    onStartTrack(trackId);
  };

  const handleRestartTrack = () => {
    if (lastResult) {
      onStartTrack(lastResult.trackId);
      onClearResult();
    }
  };

  const tabs: { id: TabId; label: string; icon: string; visible: boolean }[] = [
    { id: 'register', label: '报名', icon: '📝', visible: !isRegistered },
    { id: 'chapters', label: '章节', icon: '📖', visible: isRegistered },
    { id: 'tracks', label: '赛道', icon: '🏁', visible: isRegistered },
    { id: 'live', label: '积分', icon: '📊', visible: isRegistered },
    { id: 'ranking', label: '排名', icon: '🏆', visible: isRegistered },
  ];

  return (
    <div className="tournament-overlay">
      <div className="tournament-content">
        <div className="tournament-header">
          <div className="tournament-title">
            <span className="tournament-title-icon">🏆</span>
            赛事中心
          </div>
          <button className="tournament-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {isRegistered && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {tournament.state.currentEntry?.playerName} · {tournament.state.currentEntry?.totalScore.toLocaleString()} 分
            </div>
            <div style={{ fontSize: '13px', color: '#ffd700' }}>
              🪙 {tournament.state.totalCoins.toLocaleString()}
            </div>
          </div>
        )}

        <div className="tournament-tabs">
          {tabs
            .filter((t) => t.visible)
            .map((tab) => (
              <button
                key={tab.id}
                className={`tournament-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tournament-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
        </div>

        {activeTab === 'register' && !isRegistered && (
          <RegistrationPanel
            divisions={tournament.getAllDivisions()}
            onRegister={handleRegister}
          />
        )}

        {activeTab === 'chapters' && isRegistered && (
          <ChapterMap
            chapters={tournament.getAllChapters()}
            getChapterProgress={tournament.getChapterProgress}
            isChapterUnlocked={tournament.isChapterUnlocked}
            isTrackUnlocked={tournament.isTrackUnlocked}
            getTrackBestScore={(id) => tournament.getTrackResult(id)?.bestScore}
            getTrackMastered={(id) => tournament.getTrackResult(id)?.mastered ?? false}
            getTrackCompleted={(id) => tournament.getTrackResult(id)?.completedAt != null}
            onSelectChapter={handleSelectChapter}
          />
        )}

        {activeTab === 'tracks' && isRegistered && (
          <TrackSelection
            tracks={
              selectedChapterId
                ? tournament.getTracksForChapter(selectedChapterId)
                : tournament.getAllTracks()
            }
            isTrackUnlocked={tournament.isTrackUnlocked}
            getTrackResult={tournament.getTrackResult}
            onSelectTrack={setSelectedTrackId}
            onStartTrack={handleStartTrack}
            selectedTrackId={selectedTrackId}
          />
        )}

        {activeTab === 'live' && isRegistered && (
          <LiveScoreboard
            liveScore={tournament.liveScore}
            currentTrackName={currentTrack?.name || '未选择赛道'}
          />
        )}

        {activeTab === 'ranking' && isRegistered && (
          <RankingBoard
            rankings={tournament.rankings}
            playerEntry={tournament.getPlayerRanking()}
          />
        )}

        {lastResultData && lastResultTrack && (
          <TournamentResult
            result={lastResultData}
            trackName={lastResultTrack.name}
            onRestart={handleRestartTrack}
            onBack={onClearResult}
          />
        )}
      </div>
    </div>
  );
};
