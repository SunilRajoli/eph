import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";

/**
 * FeedScreen (Web)
 * - Same header/look & feel as ProfileScreen
 * - Search with debounce
 * - Infinite scroll (IntersectionObserver)
 * - Expand card to play HTML5 video
 * - Expects backend shape: { success, data: { videos: [], pagination: { hasNextPage } } }
 */

const Pill = ({ children }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold">
    {children}
  </span>
);

const TagChip = ({ text }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs">
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11l4 4 10-10" />
    </svg>
    {text}
  </span>
);

const useDebounced = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const FeedScreen = () => {
  // header/auth (same as Profile)
  const [navUser, setNavUser] = useState(authService.getUser?.() || null);
  const isLoggedIn = useMemo(() => !!authService.getToken(), []);
  const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

  // search
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 400);

  // data/pagination
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [hasNextPage, setHasNextPage] = useState(true);

  // expand/play
  const [expandedIndex, setExpandedIndex] = useState(null);

  // scroll sentinel
  const sentinelRef = useRef(null);

  // ---- helpers ----
  const logout = async () => {
    try {
      await apiService.logout().catch(() => {});
    } finally {
      authService.clear?.();
      window.location.replace("/roles");
    }
  };

  const normalizeMedia = (v) => {
    const copy = { ...v };
    const fix = (u) => (typeof u === "string" ? u : "");
    copy.url = fix(v.url);
    copy.thumbnail_url = fix(v.thumbnail_url ?? v.thumbnailUrl);
    return copy;
  };

  const fmtAgo = (iso) => {
    if (!iso) return "-";
    const dt = new Date(iso);
    const diff = Date.now() - dt.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const fmtLen = (sec) => {
    const s = Number(sec || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const loadFeed = async ({ reset }) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasNextPage(true);
        setExpandedIndex(null);
      } else {
        if (!hasNextPage || fetchingMore) return;
        setFetchingMore(true);
      }

      const res = await apiService.getFeed({
        page: reset ? 1 : page,
        limit,
        search: debounced || undefined,
      });

      if (res?.success) {
        const data = res.data || res;
        const fetched =
          (data?.videos || [])
            .map((v) => ({ ...v }))
            .map(normalizeMedia) ?? [];

        const pagination = data?.pagination || {};
        const next = !!pagination.hasNextPage;

        setVideos((prev) => (reset ? fetched : [...prev, ...fetched]));
        setHasNextPage(next);
        setPage((p) => (reset ? 2 : p + 1));
        setError(null);
      } else {
        setError(res?.message || "Failed to load feed");
      }
    } catch (e) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  // initial + search change
  useEffect(() => {
    setNavUser(authService.getUser?.() || null);
    loadFeed({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadFeed({ reset: false });
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, hasNextPage, loading, fetchingMore]);

  const onTogglePlay = (idx) => {
    setExpandedIndex((cur) => (cur === idx ? null : idx));
  };

  // ---- UI ----
  return (
    <div className="flex-1 p-6">
      {/* Top header (same shell as Profile) */}
      <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Feed</h1>
            <p className="text-white/60">Watch 60-sec submissions from the community</p>
          </div>
      </div>

      {/* Search bar */}
      <div className="mb-3">
        <div className="h-12 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/70" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
            <path d="m21 21-4.3-4.3" strokeWidth="2"></path>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos, descriptions, #tags…"
            className="flex-1 bg-transparent outline-none text-white placeholder-white/60 px-3"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-white/70 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 animate-pulse bg-white/30" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-6 flex flex-col items-center text-center">
          <svg className="w-12 h-12 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2"/>
          </svg>
          <p className="text-white/80 mt-2">{error}</p>
          <button
            onClick={() => loadFeed({ reset: true })}
            className="mt-3 px-3 py-1.5 rounded-lg bg-amber-400 text-black font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!error && !loading && videos.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M23 7l-7 5 7 5V7z" strokeWidth="2" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2" />
          </svg>
          <p className="text-white/80 text-lg mt-4">No videos found</p>
          <p className="text-white/50">Try a different search</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4 mt-4">
        {videos.map((v, i) => {
          const title = String(v.title ?? "");
          const desc = String(v.description ?? "");
          const tags = Array.isArray(v.tags) ? v.tags.map(String) : [];
          const views = v.views_count ?? v.viewsCount ?? 0;
          const likes = v.likes_count ?? v.likesCount ?? 0;
          const lenSec = v.length_sec ?? v.lengthSec ?? 0;
          const createdAt = v.created_at ?? v.createdAt;
          const uploader =
            (v.uploader && typeof v.uploader === "object" ? v.uploader.name : v.uploader_name) || "Unknown";
          const isExpanded = expandedIndex === i;

          return (
            <div key={v._id || v.id || i} className="bg-white/5 rounded-xl p-4 border border-white/10">
              {/* Header row */}
              <div className="flex gap-3">
                {/* Thumbnail / Play */}
                <button
                  onClick={() => onTogglePlay(i)}
                  className="relative w-[140px] h-[82px] shrink-0 rounded-lg overflow-hidden bg-white/10"
                  title={isExpanded ? "Close" : "Play"}
                >
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                      {isExpanded ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M8 5v14l11-7z" />}
                    </svg>
                  </div>
                </button>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="text-white font-bold text-[15px] line-clamp-2">{title}</div>
                  {desc && <div className="text-white/70 text-xs mt-1 line-clamp-2">{desc}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill>👤 {uploader}</Pill>
                    <Pill>👁️ {views}</Pill>
                    <Pill>❤ {likes}</Pill>
                    {createdAt && <Pill>⏱ {fmtAgo(createdAt)}</Pill>}
                  </div>
                </div>

                {/* Duration (collapsed) */}
                {!isExpanded && (
                  <div className="self-start">
                    <span className="px-2 py-1 rounded bg-black/60 text-white text-[11px] font-bold">
                      {fmtLen(lenSec)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.slice(0, 6).map((t, idx) => {
                    let txt = t.trim();
                    if (txt.startsWith("#")) txt = txt.slice(1).trim();
                    if (!txt) return null;
                    return <TagChip key={`${txt}-${idx}`} text={txt} />;
                  })}
                </div>
              )}

              {/* Player */}
              {isExpanded && v.url && (
                <div className="mt-3 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-black">
                    <video src={v.url} controls autoPlay style={{ width: "100%", height: "100%" }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Sentinel */}
        {hasNextPage && (
          <div ref={sentinelRef} className="py-6 flex items-center justify-center">
            {fetchingMore ? (
              <div className="text-white/80 text-sm">Loading more…</div>
            ) : (
              <div className="text-white/40 text-sm">Scroll to load more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedScreen;
