import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

const FILTERS = { 
  ALL: 'all', 
  ONGOING: 'ongoing', 
  UPCOMING: 'upcoming', 
  COMPLETED: 'completed',
  MY_COMPETITIONS: 'my_competitions' // NEW
};

const CompetitionScreen = () => {
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [myOnly, setMyOnly] = useState(false);
  const [counts, setCounts] = useState({ ongoing: 0, upcoming: 0, completed: 0, my: 0, my_competitions: 0 });
  const [deletingId, setDeletingId] = useState(null);

  // Optimistic flags that survive refetch
  const [optimisticRegistered, setOptimisticRegistered] = useState(() => new Set());
  const [optimisticSubmitted, setOptimisticSubmitted] = useState(() => new Set());

  // Modal state
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsMode, setDetailsMode] = useState('user'); // 'user' | 'admin'
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const getId = (c) => c.id || c._id;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchText.trim().toLowerCase()), 400);
    return () => clearTimeout(id);
  }, [searchText]);

  const computeStatus = useCallback((competition) => {
    const start = competition.start_date ? new Date(competition.start_date) : null;
    const end = competition.end_date ? new Date(competition.end_date) : null;
    const now = new Date();
    if (start && start > now) return 'upcoming';
    if (start && end && start <= now && end > now) return 'ongoing';
    if (end && end < now) return 'completed';
    return 'upcoming';
  }, []);

  const isMine = useCallback((competition) => {
    if (!user) return false;
    const postedBy = competition.posted_by || competition.createdBy;
    const postedId = postedBy?.id ?? postedBy?._id;
    const userId = user.id ?? user._id;
    return String(postedId || '') === String(userId || '');
  }, [user]);

  const isMyCompetition = useCallback((competition) => {
    if (!user) return false;
    return competition.user_registered || competition.user_submitted;
  }, [user]);

  const fetchCompetitions = useCallback(async (forceRefresh = false) => {
    if (!refreshing) {
      setLoading(!forceRefresh);
      setRefreshing(forceRefresh);
      setError(null);
    }
    try {
      const response = await apiService.listCompetitions();
      let allComps = response?.data?.competitions || response?.competitions || [];

      // Merge optimistic flags so they persist across refetch
      allComps = allComps.map((c) => {
        const cid = String(getId(c));
        return {
          ...c,
          user_registered: c.user_registered || optimisticRegistered.has(cid),
          user_submitted: c.user_submitted || optimisticSubmitted.has(cid),
        };
      });

      const newCounts = { ongoing: 0, upcoming: 0, completed: 0, my: 0, my_competitions: 0 };
      for (const comp of allComps) {
        const s = computeStatus(comp);
        if (newCounts[s] !== undefined) newCounts[s] += 1;
        if (isMine(comp)) newCounts.my += 1;
        if (isMyCompetition(comp)) newCounts.my_competitions += 1;
      }
      setCounts(newCounts);
      setAllCompetitions(allComps);
    } catch (err) {
      setError(err.message || 'Failed to load competitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [computeStatus, isMine, isMyCompetition, refreshing, optimisticRegistered, optimisticSubmitted]);

  useEffect(() => { fetchCompetitions(); }, [fetchCompetitions]);

  // If we just registered, flip it locally then refetch once for truth
  useEffect(() => {
    const cid = location.state?.justRegisteredCompetitionId;
    if (!cid) return;

    const cidStr = String(cid);
    setOptimisticRegistered(prev => {
      const next = new Set(prev);
      next.add(cidStr);
      return next;
    });

    setAllCompetitions(prev =>
      prev.map(c => (String(getId(c)) === cidStr ? { ...c, user_registered: true } : c))
    );

    fetchCompetitions(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.state, fetchCompetitions, navigate, location.pathname, location.search]);

  // If we just submitted, flip it locally then refetch once for truth
  useEffect(() => {
    const cid = location.state?.justSubmittedCompetitionId;
    if (!cid) return;

    const cidStr = String(cid);
    setOptimisticSubmitted(prev => {
      const next = new Set(prev);
      next.add(cidStr);
      return next;
    });
    // Ensures "Submitted" shows right away
    setAllCompetitions(prev =>
      prev.map(c =>
        String(getId(c)) === cidStr
          ? { ...c, user_submitted: true, user_registered: true }
          : c
      )
    );

    fetchCompetitions(true);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [location.state, fetchCompetitions, navigate, location.pathname, location.search]);

  // Navigation for user flows
  const goToRegister = (competition) => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/competition/register', { state: { competitionId: getId(competition) } });
  };

  const goToSubmit = (competition) => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/competition/submit', {
      state: { competitionId: getId(competition), competitionTitle: competition.title },
    });
  };

  // Admin view submissions navigation
  const goToAdminSubmissions = (competition) => {
    const id = getId(competition);
    navigate(`/admin/competition/${id}/submissions`, {
      state: { competitionId: id, competitionTitle: competition.title },
    });
  };

  // Admin actions
  const openAdminViewModal = (competition) => {
    setSelected(competition);
    setDetailsMode('admin');
    setConfirmingDelete(false);
    setShowDetails(true);
  };

  const handleEdit = (competition) => {
    const id = getId(competition);
    navigate(`/competition/${id}/edit`);
  };

  const handleDelete = async (competition) => {
    const id = getId(competition);
    if (!id) return;
    try {
      setDeletingId(id);
      await apiService.deleteCompetition(id);
      setShowDetails(false);
      await fetchCompetitions(true);
    } catch (e) {
      alert(e.message || 'Failed to delete competition');
    } finally {
      setDeletingId(null);
      setConfirmingDelete(false);
    }
  };

  const getStatusPill = useMemo(() => ({
    ongoing:   { icon: '●', label: 'Live', chipClass: 'bg-green-500/20 text-green-400' },
    upcoming:  { icon: '◐', label: 'Soon', chipClass: 'bg-amber-500/20 text-amber-300' },
    completed: { icon: '✓', label: 'Done', chipClass: 'bg-gray-500/20 text-gray-300' },
  }), []);

  const MetricButton = ({ label, count, selected, onClick, icon, palette }) => {
    const colorClass = {
      green: { bg: 'bg-green-500/20', text: 'text-green-400' },
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
      gray:  { bg: 'bg-gray-500/20',  text: 'text-gray-300' },
      blue:  { bg: 'bg-blue-500/20',  text: 'text-blue-300' },
    }[palette];
    return (
      <button
        onClick={onClick}
        className={`px-4 py-3 rounded-xl transition-all duration-200 ${
          selected ? 'bg-white/10 border border-white/20' : 'bg-white/5 hover:bg-white/10 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${colorClass.bg} flex items-center justify-center`}>
            <span className={`${colorClass.text} text-lg`}>{icon}</span>
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-lg">{count}</div>
            <div className="text-white/70 text-sm">{label}</div>
          </div>
        </div>
      </button>
    );
  };

  const competitions = useMemo(() => {
    let arr = allCompetitions;
    
    if (activeFilter === FILTERS.MY_COMPETITIONS) {
      // Show only competitions user has registered for or submitted to
      arr = arr.filter(isMyCompetition);
    } else if (activeFilter !== FILTERS.ALL) {
      arr = arr.filter((c) => computeStatus(c) === activeFilter);
    }
    
    if (isAdmin && myOnly) arr = arr.filter(isMine);
    
    if (debouncedQuery) {
      arr = arr.filter((c) =>
        (c.title || '').toLowerCase().includes(debouncedQuery) ||
        (c.description || '').toLowerCase().includes(debouncedQuery) ||
        (c.sponsor || '').toLowerCase().includes(debouncedQuery) ||
        (Array.isArray(c.tags) ? c.tags : []).some((t) => (t || '').toLowerCase().includes(debouncedQuery))
      );
    }
    return arr;
  }, [allCompetitions, activeFilter, myOnly, isAdmin, isMine, isMyCompetition, computeStatus, debouncedQuery]);

  // ---- Card ----
  const CompetitionCard = ({ competition }) => {
    const status = computeStatus(competition);
    const pill = getStatusPill[status] || getStatusPill.upcoming;
    const userRegistered = Boolean(competition.user_registered);
    const userSubmitted = Boolean(competition.user_submitted);
    const cid = getId(competition);

    const openUserDetails = () => {
      setSelected(competition);
      setDetailsMode('user');
      setConfirmingDelete(false);
      setShowDetails(true);
    };

    const getMyCompetitionStatus = () => {
      if (activeFilter === FILTERS.MY_COMPETITIONS) {
        if (userSubmitted) return { text: 'Submitted', class: 'bg-blue-500/20 text-blue-300' };
        if (userRegistered) return { text: 'Registered', class: 'bg-green-500/20 text-green-400' };
        return { text: 'Participating', class: 'bg-purple-500/20 text-purple-300' };
      }
      return null;
    };

    const myStatus = getMyCompetitionStatus();

    return (
      <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {competition.banner_image_url ? (
              <img src={competition.banner_image_url} alt={competition.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <svg className="w-10 h-10 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 8h14l-1 8H6L5 8zm0 0L4 6m16 2l1-2m-7 13h10" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white text-lg font-bold">{competition.title}</h3>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full ${pill.chipClass}`}>
                  <span className="text-sm font-medium">{pill.icon} {pill.label}</span>
                </div>
                {myStatus && (
                  <div className={`px-3 py-1 rounded-full ${myStatus.class}`}>
                    <span className="text-sm font-medium">{myStatus.text}</span>
                  </div>
                )}
              </div>
            </div>

            {(competition.start_date || competition.end_date) && (
              <div className="flex items-center gap-2 mb-2 text-white/70 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm0-10h14" />
                </svg>
                <span>
                  {competition.start_date ? new Date(competition.start_date).toLocaleDateString() : '—'} – {competition.end_date ? new Date(competition.end_date).toLocaleDateString() : '—'}
                </span>
              </div>
            )}

            <p className="text-white/70 mb-4 line-clamp-2">{competition.description || competition.subtitle}</p>

            {Array.isArray(competition.tags) && competition.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {competition.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md">#{tag}</span>
                ))}
                {competition.tags.length > 3 && (
                  <span className="text-white/60 text-xs">+{competition.tags.length - 3} more</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white/70 text-sm">{competition.stats?.totalRegistrations || 0} registered</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0 118 0z" />
                </svg>
                <span className="text-white/70 text-sm">{competition.seats_remaining ?? '-'} seats left</span>
              </div>
              {!!competition.max_team_size && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-white/70 text-sm">Max team: {competition.max_team_size}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-white/70 text-sm">{competition.posted_by?.name || 'Unknown'}</span>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    {/* View Submissions (admin) */}
                    <button
                      onClick={() => goToAdminSubmissions(competition)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                      title="View Submissions"
                    >
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </button>

                    {/* View opens modal */}
                    <button
                      onClick={() => openAdminViewModal(competition)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                      title="View"
                    >
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(competition)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(competition)}
                      disabled={deletingId === cid}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors disabled:opacity-60"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ) : activeFilter === FILTERS.MY_COMPETITIONS ? (
                  // Special buttons for My Competitions view
                  <div className="flex items-center gap-2">
                    {userSubmitted ? (
                      <button
                        onClick={() => navigate(`/submissions/my`)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                      >
                        View Result
                      </button>
                    ) : status === 'ongoing' && userRegistered ? (
                      <button
                        onClick={() => goToSubmit(competition)}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Submit
                      </button>
                    ) : (
                      <div className="text-white/70 text-sm">
                        {status === 'upcoming' ? 'Waiting to start' : status === 'completed' ? 'Ended' : 'Active'}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {status === 'upcoming' && (
                      userRegistered ? (
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0 118 0z" />
                          </svg>
                          Registered
                        </div>
                      ) : (
                        <button
                          onClick={openUserDetails}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Register
                        </button>
                      )
                    )}
                    {status === 'ongoing' && (
                      userSubmitted ? (
                        <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium">
                          Submitted
                        </div>
                      ) : userRegistered ? (
                        <button
                          onClick={() => goToSubmit(competition)}
                          className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Submit
                        </button>
                      ) : (
                        <div className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg text-sm font-medium">
                          Not registered
                        </div>
                      )
                    )}
                    {status === 'completed' && (
                      <div className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-lg text-sm font-medium">
                        {userSubmitted ? 'Submitted' : userRegistered ? 'Not submitted' : 'Not registered'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---- Details Modal (user & admin) ----
  const DetailsModal = () => {
    if (!showDetails || !selected) return null;
    const status = computeStatus(selected);
    const pill = getStatusPill[status] || getStatusPill.upcoming;

    const close = () => {
      setShowDetails(false);
      setConfirmingDelete(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

        {/* modal card */}
        <div className="relative z-10 w-full max-w-3xl mx-4 bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          {/* header */}
          <div className="p-4 border-b border-white/10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                {selected.banner_image_url ? (
                  <img src={selected.banner_image_url} alt={selected.title} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 8h14l-1 8H6L5 8zm0 0L4 6m16 2l1-2m-7 13h10" />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{selected.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${pill.chipClass}`}>
                    {pill.icon} {pill.label}
                  </span>
                </div>
                {selected.sponsor && <p className="text-white/60 text-sm">Sponsor: {selected.sponsor}</p>}
              </div>
            </div>
            <button onClick={close} className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors" aria-label="Close">
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* body */}
          <div className="p-5 max-h-[70vh] overflow-auto space-y-4">
            {selected.description && <p className="text-white/80">{selected.description}</p>}

            <div className="grid sm:grid-cols-2 gap-3">
              {(selected.start_date || selected.end_date) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/70 text-sm">
                    {selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '—'} – {selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '—'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0 118 0z" />
                </svg>
                <span className="text-white/70 text-sm">Seats left: {selected.seats_remaining ?? '—'}</span>
              </div>
              {!!selected.max_team_size && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-white/70 text-sm">Max team size: {selected.max_team_size}</span>
                </div>
              )}
              {selected.location && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8c0 7.5-7.5 12-7.5 12S4.5 15.5 4.5 8a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-white/70 text-sm">{selected.location}</span>
                </div>
              )}
            </div>

            {Array.isArray(selected.tags) && selected.tags.length > 0 && (
              <div>
                <p className="text-white/70 text-sm mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md">#{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
            {isAdmin && detailsMode === 'admin' ? (
              <>
                <button
                  onClick={() => goToAdminSubmissions(selected)}
                  className="px-4 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  View Submissions
                </button>

                <button
                  onClick={() => navigate(`/competition/${getId(selected)}`)}
                  className="px-4 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  View Page
                </button>
                <button
                  onClick={() => handleEdit(selected)}
                  className="px-4 h-10 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-colors"
                >
                  Edit
                </button>

                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="px-4 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 transition-colors"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm">Confirm?</span>
                    <button
                      disabled={deletingId === getId(selected)}
                      onClick={() => handleDelete(selected)}
                      className="px-3 h-10 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-red-200 disabled:opacity-60"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="px-3 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <button
                  onClick={close}
                  className="ml-2 px-4 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => goToRegister(selected)}
                  className="px-4 h-10 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Competitions</h2>
                <p className="text-white/70">Discover and join exciting competitions</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/competition/create')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Competition
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="mb-4">
                <button
                  onClick={() => setMyOnly((v) => !v)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    myOnly ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Competitions ({counts.my})
                </button>
              </div>
            )}

            <div className="flex gap-4 mb-4">
              <MetricButton label="Ongoing"  count={counts.ongoing}  selected={activeFilter === FILTERS.ONGOING}  onClick={() => setActiveFilter(FILTERS.ONGOING)}  icon="●" palette="green" />
              <MetricButton label="Upcoming" count={counts.upcoming} selected={activeFilter === FILTERS.UPCOMING} onClick={() => setActiveFilter(FILTERS.UPCOMING)} icon="◐" palette="amber" />
              <MetricButton label="Completed" count={counts.completed} selected={activeFilter === FILTERS.COMPLETED} onClick={() => setActiveFilter(FILTERS.COMPLETED)} icon="✓" palette="gray" />
              {!isAdmin && ( // Only show for regular users
                <MetricButton 
                  label="My Competitions" 
                  count={counts.my_competitions} 
                  selected={activeFilter === FILTERS.MY_COMPETITIONS} 
                  onClick={() => setActiveFilter(FILTERS.MY_COMPETITIONS)} 
                  icon="★" 
                  palette="blue" 
                />
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search competitions, sponsors, tags..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
              />
              {!!searchText && (
                <button onClick={() => setSearchText('')} className="absolute inset-y-0 right-0 pr-3 flex items-center" aria-label="Clear search">
                  <svg className="h-5 w-5 text-white/50 hover:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Error loading competitions</p>
                  <p className="text-red-400/90 text-sm">{error}</p>
                </div>
                <button onClick={() => fetchCompetitions(true)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors">
                  Retry
                </button>
              </div>
            </div>
          )}

          {refreshing && (
            <div className="mb-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white/30 animate-pulse"></div>
              </div>
            </div>
          )}

          {competitions.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
              </svg>
              <h3 className="text-white text-lg font-medium mb-2">
                {activeFilter === FILTERS.MY_COMPETITIONS ? 'No competitions joined yet' : 'No competitions found'}
              </h3>
              <p className="text-white/60">
                {activeFilter === FILTERS.MY_COMPETITIONS 
                  ? 'Register for competitions to see them here' 
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {competitions.map((c) => (
                <CompetitionCard key={getId(c)} competition={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <DetailsModal />
    </>
  );
};

export default CompetitionScreen;