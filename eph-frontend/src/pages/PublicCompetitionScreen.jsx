// src/pages/PublicCompetitionScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";
import logo from "../assets/logo.jpg";
import {
  Menu, X, Sun, Moon, Compass, Rocket, CheckCircle,
} from "lucide-react";

/* -------------------------------- helpers -------------------------------- */
const fmtShort = (d) => {
  try { return d ? new Date(d).toLocaleDateString() : "—"; } catch { return "—"; }
};
const fmtLong = (d) => {
  try {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch { return "—"; }
};
const computeStatus = (competition) => {
  const start = competition.start_date ? new Date(competition.start_date) : null;
  const end = competition.end_date ? new Date(competition.end_date) : null;
  const now = new Date();
  if (start && start > now) return "upcoming";
  if (start && end && start <= now && end > now) return "ongoing";
  if (end && end < now) return "completed";
  return "upcoming";
};
const STATUS_PILL = (isDark) => ({
  ongoing: { icon: "●", label: "Live", chipClass: isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-600" },
  upcoming: { icon: "◐", label: "Soon", chipClass: isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-600" },
  completed:{ icon: "✓", label: "Done", chipClass: isDark ? "bg-slate-500/15 text-slate-300" : "bg-slate-100 text-slate-700" },
});

/* ----------------------- Details Drawer (landing theme) ------------------- */
const CompetitionDetailsDrawer = ({ compId, open, onClose, isDark }) => {
  const [loading, setLoading] = useState(true);
  const [comp, setComp] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Leaderboard lazy load
  const [lbLoading, setLbLoading] = useState(false);
  const [lbData, setLbData] = useState([]);
  const [lbQuery, setLbQuery] = useState("");

  useEffect(() => {
    if (!open || !compId) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await apiService.getCompetition(compId);
        const data = res?.data?.competition || res?.competition || res;
        setComp(data || null);
      } catch (e) {
        setError(e?.message || "Failed to load competition");
      } finally { setLoading(false); }
    })();
  }, [open, compId]);

  useEffect(() => {
    if (!open || activeTab !== "leaderboard" || lbData.length || !compId) return;
    (async () => {
      setLbLoading(true);
      try {
        const res = await apiService.getCompetitionLeaderboard(compId);
        setLbData(res?.data?.leaderboard || res?.leaderboard || []);
      } finally { setLbLoading(false); }
    })();
  }, [open, activeTab, lbData.length, compId]);

  const filteredLb = useMemo(() => {
    if (!lbQuery) return lbData;
    const q = lbQuery.toLowerCase();
    return lbData.filter((r, i) => {
      const rankMatch = String(r.rank ?? i + 1).includes(lbQuery);
      const name = r.team_name || r.leader?.name || "";
      return rankMatch || name.toLowerCase().includes(q);
    });
  }, [lbData, lbQuery]);

  const timelineItems = useMemo(() => {
    if (!comp) return [];
    const items = [];
    if (comp.registration_start_date) items.push({ k: "regOpen", date: comp.registration_start_date, text: "Registration Opens" });
    if (comp.registration_deadline) items.push({ k: "regClose", date: comp.registration_deadline, text: "Entry Deadline (Accept rules before this date)" });
    if (comp.start_date) items.push({ k: "start", date: comp.start_date, text: "Start Date" });
    if (comp.end_date) items.push({ k: "end", date: comp.end_date, text: "Final Submission Deadline" });
    if (comp.results_date) items.push({ k: "results", date: comp.results_date, text: "Results Announced" });
    const t = (d) => (d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER);
    return items.sort((a, b) => t(a.date) - t(b.date));
  }, [comp]);

  return (
    <div className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* overlay */}
      <div onClick={onClose}
           className={`absolute inset-0 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"} ${isDark ? "bg-black/50" : "bg-slate-900/30"}`} />
      {/* drawer */}
      <div className={`absolute right-0 top-0 h-full w-full md:w-[880px] border-l shadow-2xl transform transition-transform
        ${open ? "translate-x-0" : "translate-x-full"}
        ${isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-4 py-3 border-b backdrop-blur-md
          ${isDark ? "bg-slate-900/80 border-white/10" : "bg-white/75 border-slate-200"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {comp?.banner_image_url && (
                <img src={comp.banner_image_url} alt={comp?.title} className="w-10 h-10 rounded-lg object-cover border border-black/10" />
              )}
              <div>
                <h2 className={`${isDark ? "text-white" : "text-slate-900"} font-semibold leading-tight`}>{comp?.title || "Competition"}</h2>
                {comp?.sponsor && <p className={`${isDark ? "text-slate-300" : "text-slate-600"} text-xs`}>Sponsor: {comp.sponsor}</p>}
              </div>
            </div>
            <button onClick={onClose}
              className={`${isDark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"} p-2 rounded-lg transition`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto h-[calc(100%-56px)]">
          {/* Banner */}
          {comp?.banner_image_url && (
            <div className={`rounded-xl overflow-hidden border ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <img src={comp.banner_image_url} alt={comp?.title} className="w-full max-h-[260px] object-cover" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {["overview","leaderboard","timeline","rules"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
                ${activeTab === tab
                    ? (isDark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-900")
                    : (isDark ? "text-slate-300 hover:text-white hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className={`p-5 rounded-b-xl rounded-tr-xl border
            ${isDark ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200"}`}>
            {/* Overview */}
            {activeTab === "overview" && (
              <>
                {(comp?.description_long || comp?.overview || comp?.description) && (
                  <div>
                    <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Overview</h4>
                    <p className={`${isDark ? "text-slate-300" : "text-slate-700"} whitespace-pre-wrap`}>
                      {comp.description_long || comp.overview || comp.description}
                    </p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <div className={`px-3 py-2 rounded-lg border ${isDark ? "bg-slate-800 border-white/10 text-slate-200" : "bg-sky-50 border-sky-100 text-slate-700"}`}>
                    <strong>Start:</strong> {fmtShort(comp?.start_date)}
                  </div>
                  <div className={`px-3 py-2 rounded-lg border ${isDark ? "bg-slate-800 border-white/10 text-slate-200" : "bg-sky-50 border-sky-100 text-slate-700"}`}>
                    <strong>End:</strong> {fmtShort(comp?.end_date)}
                  </div>
                </div>

                {comp?.max_team_size && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Team Size</h4>
                    <p className={`${isDark ? "text-slate-300" : "text-slate-700"}`}>Maximum {comp.max_team_size} members per team.</p>
                  </div>
                )}

                {comp?.prize_pool && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Prize Pool</h4>
                    <p className={`${isDark ? "text-slate-100" : "text-slate-800"} text-lg font-bold`}>${comp.prize_pool}</p>
                  </div>
                )}
              </>
            )}

            {/* Leaderboard */}
            {activeTab === "leaderboard" && (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h4 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>Leaderboard</h4>
                  <input
                    value={lbQuery}
                    onChange={(e) => setLbQuery(e.target.value)}
                    placeholder="Search..."
                    className={`px-3 py-2 rounded-lg border outline-none
                      ${isDark ? "bg-slate-800 border-white/10 text-white placeholder-slate-400" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"}`}
                  />
                </div>

                {lbLoading ? (
                  <div className="flex justify-center py-10">
                    <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${isDark ? "border-white" : "border-slate-800"}`} />
                  </div>
                ) : filteredLb.length === 0 ? (
                  <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-center py-10`}>No leaderboard data available</p>
                ) : (
                  <div className={`overflow-auto rounded-xl border ${isDark ? "border-white/10" : "border-slate-200"}`}>
                    <table className="min-w-full text-sm">
                      <thead className={`${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-50 text-slate-700"}`}>
                        <tr>
                          <th className="text-left px-4 py-2">Rank</th>
                          <th className="text-left px-4 py-2">Team/User</th>
                          <th className="text-left px-4 py-2">Score</th>
                          <th className="text-left px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {filteredLb.map((row, i) => (
                          <tr key={i} className={isDark ? (i % 2 ? "bg-slate-900" : "bg-slate-900/60") : (i % 2 ? "bg-white" : "bg-slate-50/40")}>
                            <td className="px-4 py-2">{row.rank ?? i + 1}</td>
                            <td className="px-4 py-2">{row.team_name || row.leader?.name || "—"}</td>
                            <td className="px-4 py-2">
                              {typeof row.final_score === "number" ? row.final_score.toFixed(3) : row.score?.toFixed?.(3) || "—"}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                row.status === "winner"
                                  ? (isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700")
                                  : row.status === "shortlisted"
                                  ? (isDark ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700")
                                  : (isDark ? "bg-slate-500/15 text-slate-300" : "bg-slate-100 text-slate-700")
                              }`}>
                                {row.status || "submitted"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Timeline (rail with dots on the line) */}
            {activeTab === "timeline" && (
              <>
                <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Timeline</h4>
                {timelineItems.length === 0 ? (
                  <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>No timeline data available.</p>
                ) : (
                  <div className="relative pl-10">
                    {/* vertical rail */}
                    <div className={`absolute left-4 top-0 bottom-0 w-px ${isDark ? "bg-white/15" : "bg-slate-300"}`} />
                    <ul className="space-y-6">
                      {timelineItems.map((it, idx) => (
                        <li key={`${it.k}-${idx}`} className="relative">
                          {/* dot on rail */}
                          <span className={`absolute left-4 top-1.5 -translate-x-1/2 w-3 h-3 rounded-full border ${isDark ? "bg-white border-white/40" : "bg-slate-700 border-slate-300"}`} />
                          <div className={`${isDark ? "text-slate-200" : "text-slate-800"} ml-8`}>
                            <span className="font-medium">{fmtLong(it.date)}</span> — <span className={`${isDark ? "opacity-90" : "opacity-90"}`}>{it.text}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Rules */}
            {activeTab === "rules" && (
              <>
                <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Rules</h4>
                {comp?.rules_markdown || comp?.rules ? (
                  <div className={`${isDark ? "text-slate-200" : "text-slate-800"} whitespace-pre-wrap`}>
                    {comp.rules_markdown || comp.rules}
                  </div>
                ) : (
                  <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>No rules have been provided for this competition.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------- Main Landing-themed page --------------------------- */
const PublicCompetitionScreen = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  // Details drawer
  const [showDetails, setShowDetails] = useState(false);
  const [detailsId, setDetailsId] = useState(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchCompetitions = useCallback(async () => {
    try {
      const response = await apiService.listCompetitions();
      const allComps = response?.data?.competitions || response?.competitions || [];
      // Keep upcoming by default (feel free to adjust)
      const filtered = allComps.filter((comp) => computeStatus(comp) === "upcoming");
      setCompetitions(filtered);
    } catch (err) {
      setError(err.message || "Failed to load competitions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompetitions(); }, [fetchCompetitions]);

  const filteredCompetitions = competitions.filter(
    (c) =>
      !searchText ||
      (c.title || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRegisterClick = (e, comp) => {
    e.stopPropagation(); // prevent opening drawer
    if (!isAuthenticated) {
      setSelectedCompetition(comp);
      setShowAuthModal(true);
    } else {
      navigate("/competition/register", { state: { competitionId: comp.id } });
    }
  };

  const handleSignUp = () => {
    setShowAuthModal(false);
    navigate("/roles", { state: { returnTo: "/competitions", competitionId: selectedCompetition?.id } });
  };
  const handleLogin = () => {
    setShowAuthModal(false);
    navigate("/login", { state: { returnTo: "/competitions", competitionId: selectedCompetition?.id } });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-white" : "border-slate-800"}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? "bg-slate-900 text-slate-200" : "bg-slate-50 text-slate-700"}`}>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} backdrop-blur-md rounded-2xl p-6 max-w-md w-full border shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Sign In Required</h3>
              <button onClick={() => setShowAuthModal(false)} className={isDark ? "text-white/70 hover:text-white" : "text-slate-700 hover:text-slate-900"}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className={`${isDark ? "bg-slate-700" : "bg-slate-100"} w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center`}>
                <Rocket className={isDark ? "text-cyan-300 w-8 h-8" : "text-sky-500 w-8 h-8"} />
              </div>
              <p className={`${isDark ? "text-slate-200" : "text-slate-800"} text-center mb-2`}>
                To register for <span className="font-semibold">{selectedCompetition?.title}</span>, you need an account.
              </p>
              <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm text-center`}>
                Sign up to participate in competitions and showcase your skills!
              </p>
            </div>

            <div className="space-y-3">
              <button onClick={handleSignUp}
                className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-colors">
                Create Account
              </button>
              <button onClick={handleLogin}
                className={`w-full py-3 rounded-xl font-bold transition-colors border
                  ${isDark ? "bg-slate-700 text-white hover:bg-slate-600 border-slate-600"
                           : "bg-white text-slate-800 hover:bg-slate-50 border-slate-300"}`}>
                I Already Have an Account
              </button>
              <button onClick={() => setShowAuthModal(false)}
                className={`${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"} w-full py-2 transition-colors text-sm`}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      <CompetitionDetailsDrawer compId={detailsId} open={showDetails} onClose={() => setShowDetails(false)} isDark={isDark} />

      {/* Nav (landing theme) */}
      <nav className={`backdrop-blur-lg sticky top-0 z-50 ${isDark ? "bg-slate-800/90 border-b border-slate-700" : "bg-white/80 border-b border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img src={logo} alt="EPH Logo" className="h-8 w-8 rounded-full object-cover" />
              <span className={`ml-3 text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>PPL</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <RouterLink to="/" className={`${isDark ? "text-slate-300 hover:text-cyan-400" : "text-slate-600 hover:text-cyan-600"} font-medium`}>Home</RouterLink>
              {/* <RouterLink to="/about" className={`${isDark ? "text-slate-300 hover:text-cyan-400" : "text-slate-600 hover:text-cyan-600"} font-medium`}>About</RouterLink> */}
              <RouterLink to="/competitions" className={`${isDark ? "text-white" : "text-slate-900"} font-semibold`}>Competitions</RouterLink>

              <button onClick={() => setIsDark(!isDark)}
                className={`${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} p-2 rounded-lg transition`}>
                {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
              </button>

              <RouterLink to="/roles"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
                Register
              </RouterLink>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <button onClick={() => setIsDark(!isDark)}
                className={`${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} p-2 rounded-lg transition`}>
                {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
              </button>
              <button onClick={() => setMobileMenuOpen((v) => !v)} className={isDark ? "text-white" : "text-slate-800"}>
                {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
            <div className="px-4 pt-2 pb-4 space-y-2">
              {[
                { to: "/", label: "Home" },
                // { to: "/about", label: "About" },
                { to: "/competitions", label: "Competitions" },
                { to: "/roles", label: "Sign Up" },
              ].map((l) => (
                <RouterLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-2 rounded-md font-medium
                    ${isDark ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {l.label}
                </RouterLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className={`relative text-center py-20 sm:py-28 px-4 overflow-hidden ${isDark ? "bg-slate-800" : "bg-gradient-to-br from-sky-50 to-blue-50"}`}>
        <div className={`absolute top-0 left-0 w-64 h-64 rounded-full opacity-40 -translate-x-16 -translate-y-16 blur-2xl ${isDark ? "bg-cyan-900" : "bg-cyan-200"}`} />
        <div className={`absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-40 translate-x-16 translate-y-16 blur-2xl ${isDark ? "bg-purple-900" : "bg-purple-200"}`} />
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className={`${isDark ? "text-white" : "text-slate-900"} text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tighter`}>
            Explore Upcoming Competitions
          </h1>
          <p className={`${isDark ? "text-slate-300" : "text-slate-600"} text-lg md:text-xl mb-10`}>
            Join challenges, collaborate with peers, and showcase your ideas to the world.
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <RouterLink to="/roles"
              className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 bg-cyan-500 text-white hover:bg-cyan-600">
              <Rocket className="h-5 w-5" /> Get Started
            </RouterLink>
            <a href="#list"
               className={`px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 border
                 ${isDark ? "bg-slate-800 text-white hover:bg-slate-700 border-slate-700" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-300"}`}>
              <Compass className="h-5 w-5" /> Browse Competitions
            </a>
          </div>
        </div>
      </section>

      {/* Search + List */}
      <section id="list" className={`py-12 px-4 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl outline-none border
                ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"}`}
            />
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-xl ${isDark ? "bg-red-500/15 border border-red-500/30 text-red-300" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {error}
            </div>
          )}

          <div className="grid gap-6">
            {filteredCompetitions.map((comp) => {
              const pill = STATUS_PILL(isDark)[computeStatus(comp)];
              return (
                <div
                  key={comp.id}
                  onClick={() => { setDetailsId(comp.id); setShowDetails(true); }}
                  className={`rounded-xl p-6 transition-colors cursor-pointer border hover:shadow
                    ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden
                      ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                      {comp.banner_image_url ? (
                        <img src={comp.banner_image_url} alt={comp.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Compass className={`${isDark ? "text-slate-300" : "text-slate-500"} w-10 h-10`} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <h3 className={`${isDark ? "text-white" : "text-slate-900"} text-lg font-bold`}>{comp.title}</h3>
                        <div className={`px-3 py-1 rounded-full ${pill.chipClass}`}>
                          <span className="text-sm font-medium">{pill.icon} {pill.label}</span>
                        </div>
                      </div>

                      {(comp.start_date || comp.end_date) && (
                        <div className={`${isDark ? "text-slate-300" : "text-slate-600"} flex items-center gap-2 mb-2 text-sm`}>
                          {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 21h14" />
                          </svg> */}
                          <span>{fmtShort(comp.start_date)} – {fmtShort(comp.end_date)}</span>
                        </div>
                      )}

                      <p className={`${isDark ? "text-slate-300" : "text-slate-600"} mb-4 line-clamp-2`}>
                        {comp.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className={`${isDark ? "text-slate-300" : "text-slate-600"} flex items-center gap-2 text-sm`}>
                          <CheckCircle className="w-4 h-4" />
                          <span>{comp.stats?.totalRegistrations || 0} registered</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegisterClick(e, comp);
                          }}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
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
              <svg className={`${isDark ? "text-slate-600" : "text-slate-300"} w-16 h-16 mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6" />
              </svg>
              <h3 className={`${isDark ? "text-white" : "text-slate-900"} text-lg font-medium mb-2`}>No upcoming competitions</h3>
              <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>Check back later for new challenges</p>
            </div>
          )}
        </div>
      </section>

      {/* Simple CTA strip (keeps landing vibe) */}
      <section className={`${isDark ? "bg-slate-800" : "bg-gradient-to-br from-sky-600 to-blue-700"} text-white py-14`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">Ready to join the next big challenge?</h3>
          <p className="opacity-90 mb-6">Create a free account and start competing today.</p>
          <RouterLink to="/roles" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-sky-700 font-semibold hover:bg-sky-50 transition">
            <Rocket className="w-5 h-5" /> Create Account
          </RouterLink>
        </div>
      </section>
    </div>
  );
};

export default PublicCompetitionScreen;
