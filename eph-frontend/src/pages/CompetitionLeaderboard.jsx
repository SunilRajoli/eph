import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { apiService } from '../services/apiService';

const CompetitionLeaderboard = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCompetitionLeaderboard(competitionId);
        setData(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchLeaderboard();
    }
  }, [competitionId]);

  const getRankIcon = (index) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  const PodiumCard = ({ entry, rank, style }) => {
    const colors = {
      gold: 'from-yellow-500/30 to-yellow-600/20 border-yellow-400/40',
      silver: 'from-gray-400/30 to-gray-500/20 border-gray-400/40',
      bronze: 'from-orange-600/30 to-orange-700/20 border-orange-500/40'
    };

    const heights = {
      gold: 'h-72',
      silver: 'h-60',
      bronze: 'h-52'
    };

    return (
      <div className={`relative ${heights[style]} flex flex-col justify-end`}>
        <div className={`bg-gradient-to-b ${colors[style]} border-2 rounded-t-2xl p-6 text-center transform transition-transform hover:scale-105`}>
          <div className="text-6xl mb-3">{getRankIcon(rank - 1)}</div>
          <div className="text-5xl font-bold text-white mb-2">#{rank}</div>
          
          <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {entry.leader?.profile_pic_url ? (
              <img src={entry.leader.profile_pic_url} alt={entry.leader.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          <div className="text-white font-bold text-lg mb-1">{entry.team_name || entry.leader?.name}</div>
          <div className="text-white/80 text-sm mb-3 line-clamp-2">{entry.title}</div>
          
          <div className="bg-white/20 rounded-lg px-4 py-2 inline-block">
            <div className="text-white/70 text-xs">Score</div>
            <div className="text-white font-bold text-2xl">{entry.final_score?.toFixed(1) || 'N/A'}</div>
          </div>
        </div>
      </div>
    );
  };

  const ListCard = ({ entry, rank }) => {
    return (
      <div className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-xl flex-shrink-0">
            {rank}
          </div>

          <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {entry.leader?.profile_pic_url ? (
              <img src={entry.leader.profile_pic_url} alt={entry.leader.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-white font-semibold truncate">{entry.team_name || entry.leader?.name}</div>
              {entry.status === 'winner' && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">Winner</span>
              )}
            </div>
            <div className="text-white/70 text-sm truncate">{entry.title}</div>
            {entry.leader?.college && (
              <div className="text-white/50 text-xs mt-1">{entry.leader.college}</div>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-white/60 text-xs mb-1">Score</div>
            <div className="text-white font-bold text-xl">{entry.final_score?.toFixed(1) || 'N/A'}</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={(page) => navigate(`/main?tab=${page}`)}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout currentPage="competitions" onPageChange={(page) => navigate(`/main?tab=${page}`)}>
        <div className="p-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300">
            {error}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const topThree = data?.leaderboard?.slice(0, 3) || [];
  const remaining = data?.leaderboard?.slice(3) || [];

  return (
    <SidebarLayout currentPage="competitions" onPageChange={(page) => navigate(`/main?tab=${page}`)}>
      <div className="p-6">
        <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{data?.competition?.title}</h1>
              <p className="text-white/70">Competition Results & Leaderboard</p>
              {data?.competition?.sponsor && (
                <p className="text-white/60 text-sm mt-1">Sponsored by {data.competition.sponsor}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-white/60 text-sm">Total Submissions</div>
              <div className="text-white font-bold text-3xl">{data?.totalEntries || 0}</div>
            </div>
          </div>
        </div>

        {topThree.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span> Top Performers
            </h2>
            
            <div className="grid grid-cols-3 gap-4 items-end mb-8">
              {topThree[1] && (
                <PodiumCard entry={topThree[1]} rank={2} style="silver" />
              )}
              {topThree[0] && (
                <PodiumCard entry={topThree[0]} rank={1} style="gold" />
              )}
              {topThree[2] && (
                <PodiumCard entry={topThree[2]} rank={3} style="bronze" />
              )}
            </div>
          </div>
        )}

        {remaining.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">All Rankings</h2>
            <div className="space-y-3">
              {remaining.map((entry, index) => (
                <ListCard key={entry.id} entry={entry} rank={index + 4} />
              ))}
            </div>
          </div>
        )}

        {(!data?.leaderboard || data.leaderboard.length === 0) && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
            </svg>
            <h3 className="text-white text-lg font-medium mb-2">No Results Yet</h3>
            <p className="text-white/60">Results will be published after evaluation</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default CompetitionLeaderboard;