// src/pages/PublicCompetitionScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";

const PublicCompetitionScreen = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ✅ NEW: Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

const fetchCompetitions = useCallback(async () => {
  try {
    const response = await apiService.listCompetitions();
    const allComps = response?.data?.competitions || response?.competitions || [];
    
    // ✅ Filter: only show ongoing competitions
    const ongoingComps = allComps.filter(comp => {
      const status = computeStatus(comp);
      return status === 'upcoming';
    });
    
    setCompetitions(ongoingComps);
  } catch (err) {
    setError(err.message || "Failed to load competitions");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const computeStatus = (competition) => {
    const start = competition.start_date
      ? new Date(competition.start_date)
      : null;
    const end = competition.end_date ? new Date(competition.end_date) : null;
    const now = new Date();
    if (start && start > now) return "upcoming";
    if (start && end && start <= now && end > now) return "ongoing";
    if (end && end < now) return "completed";
    return "upcoming";
  };

  const getStatusPill = useMemo(
    () => ({
      ongoing: {
        icon: "●",
        label: "Live",
        chipClass: "bg-green-500/20 text-green-400",
      },
      upcoming: {
        icon: "◐",
        label: "Soon",
        chipClass: "bg-amber-500/20 text-amber-300",
      },
      completed: {
        icon: "✓",
        label: "Done",
        chipClass: "bg-gray-500/20 text-gray-300",
      },
    }),
    []
  );

  const filteredCompetitions = competitions.filter(
    (c) =>
      !searchText ||
      (c.title || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchText.toLowerCase())
  );

  // ✅ UPDATED: Show modal instead of alert
  const handleRegisterClick = (comp) => {
    if (!isAuthenticated) {
      setSelectedCompetition(comp);
      setShowAuthModal(true);
    } else {
      navigate("/competition/register", { state: { competitionId: comp.id } });
    }
  };

  // ✅ NEW: Modal action handlers
  const handleSignUp = () => {
    setShowAuthModal(false);
    navigate("/roles", { 
      state: { 
        returnTo: "/competitions",
        competitionId: selectedCompetition?.id 
      } 
    });
  };

  const handleLogin = () => {
    setShowAuthModal(false);
    navigate("/login", { 
      state: { 
        returnTo: "/competitions",
        competitionId: selectedCompetition?.id 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* ✅ NEW: Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Sign In Required</h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-white/90 text-center mb-2">
                To register for <span className="font-semibold">{selectedCompetition?.title}</span>, you need an account.
              </p>
              <p className="text-white/70 text-sm text-center">
                Sign up to participate in competitions and showcase your skills!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-white/90 transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition-colors border border-white/30"
              >
                I Already Have an Account
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-white/70 hover:text-white transition-colors text-sm"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
        {/* ... rest of your existing navigation code ... */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">E</span>
              </div>
              <span className="text-white font-bold text-lg">EPH Platform</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate("/")}
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                About
              </button>
              <button
                onClick={() => navigate("/competitions")}
                className="text-white transition-colors font-medium"
              >
                Competitions
              </button>
              <button
                onClick={() => navigate("/roles")}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors border border-white/30"
              >
                Sign Up
              </button>
            </div>

            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <button
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigate("/about");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg"
              >
                About
              </button>
              <button
                onClick={() => {
                  navigate("/competitions");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg"
              >
                Competitions
              </button>
              <button
                onClick={() => {
                  navigate("/roles");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 bg-white/20 text-white rounded-lg font-medium"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Rest of your existing content... */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Competitions</h1>
            <p className="text-white/80">
              Discover exciting opportunities to showcase your skills
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-6">
            {filteredCompetitions.map((comp) => {
              const status = computeStatus(comp);
              const pill = getStatusPill[status];

              return (
                <div
                  key={comp.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comp.banner_image_url ? (
                        <img
                          src={comp.banner_image_url}
                          alt={comp.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <svg
                          className="w-10 h-10 text-white/50"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 8h14l-1 8H6L5 8zm0 0L4 6m16 2l1-2m-7 13h10" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white text-lg font-bold">
                          {comp.title}
                        </h3>
                        <div
                          className={`px-3 py-1 rounded-full ${pill.chipClass}`}
                        >
                          <span className="text-sm font-medium">
                            {pill.icon} {pill.label}
                          </span>
                        </div>
                      </div>

                      {(comp.start_date || comp.end_date) && (
                        <div className="flex items-center gap-2 mb-2 text-white/70 text-sm">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm0-10h14"
                            />
                          </svg>
                          <span>
                            {comp.start_date
                              ? new Date(comp.start_date).toLocaleDateString()
                              : "—"}{" "}
                            –{" "}
                            {comp.end_date
                              ? new Date(comp.end_date).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      )}

                      <p className="text-white/70 mb-4 line-clamp-2">
                        {comp.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-white/70 text-sm">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              <path d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>
                              {comp.stats?.totalRegistrations || 0} registered
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRegisterClick(comp)}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors border border-white/30"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCompetitions.length === 0 && (
  <div className="text-center py-16">
    <svg
      className="w-16 h-16 text-white/30 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6"
      />
    </svg>
    <h3 className="text-white text-lg font-medium mb-2">
      No ongoing competitions
    </h3>
    <p className="text-white/60">Check back later for active competitions</p>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default PublicCompetitionScreen;