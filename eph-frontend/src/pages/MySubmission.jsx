// src/pages/MySubmission.jsx
import React, { useEffect, useState, useMemo } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const chip = (status) => {
  const map = {
    submitted:       'bg-white/10 text-white',
    under_review:    'bg-amber-500/20 text-amber-200',
    needs_changes:   'bg-orange-500/20 text-orange-200',
    disqualified:    'bg-red-500/20 text-red-300',
    shortlisted:     'bg-blue-500/20 text-blue-200',
    winner:          'bg-green-500/20 text-green-200',
    not_winner:      'bg-gray-500/20 text-gray-300',
    published:       'bg-white/20 text-white'
  };
  return map[status] || 'bg-white/10 text-white';
};

const STATUS_OPTIONS = [
  'submitted',
  'under_review',
  'needs_changes',
  'shortlisted',
  'winner',
  'not_winner',
  'disqualified',
  'published',
];

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

export default function MySubmission() {
  const navigate = useNavigate();
  const { id: competitionIdParam } = useParams(); // present in admin route
  const { user } = useAuth();

  // Admin mode if a competitionId is present in URL AND user is admin
  const isAdminMode = useMemo(
    () => !!competitionIdParam && (user?.role || '').toLowerCase() === 'admin',
    [competitionIdParam, user]
  );

  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState(null);

  // Local edit state for evaluation per submission
  const [drafts, setDrafts] = useState({}); // { [submissionId]: { status, final_score, feedback, saving, err } }

  const primeDraft = (s) => ({
    status: s.status || 'submitted',
    final_score: s.final_score ?? '',
    feedback: s.feedback || '',
    saving: false,
    err: null,
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        let res;
        if (isAdminMode) {
          res = await apiService.listSubmissionsByCompetition(competitionIdParam);
        } else {
          res = await apiService.listMySubmissions();
        }

        const list = res?.data?.submissions || res?.submissions || [];
        const clean = Array.isArray(list) ? list : [];
        setSubs(clean);

        // initialize drafts for each submission (admin only; harmless for users)
        const init = {};
        for (const s of clean) init[s.id] = primeDraft(s);
        setDrafts(init);
      } catch (e) {
        setError(e?.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminMode, competitionIdParam]);

  const updateDraft = (id, patch) => {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), ...patch } }));
  };

  const saveEvaluation = async (s) => {
    const d = drafts[s.id] || primeDraft(s);
    updateDraft(s.id, { saving: true, err: null });
    try {
      const payload = {
        status: d.status,
        // send score only if it's a valid number
        ...(d.final_score !== '' && !Number.isNaN(Number(d.final_score)) ? { final_score: Number(d.final_score) } : {}),
        feedback: d.feedback || undefined,
      };
      await apiService.updateSubmission(s.id, payload);

      // reflect changes in visible list
      setSubs((prev) =>
        prev.map((x) =>
          x.id === s.id ? { ...x, ...payload } : x
        )
      );
    } catch (e) {
      updateDraft(s.id, { err: e?.message || 'Failed to save evaluation' });
      return;
    } finally {
      updateDraft(s.id, { saving: false });
    }
  };

  // NEW: navigate to feed video detail if admin & we have a video id; otherwise open external URL
  const goToVideo = (s) => {
    const vid =
      s.video_id ||
      s.videoId ||
      s.video?.id ||
      s.video?.video_id;

    if (isAdminMode && vid) {
      navigate(`/feed/${encodeURIComponent(vid)}`);
      return;
    }
    if (s.video_url) {
      window.open(s.video_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <SidebarLayout
      currentPage="competitions"
      onPageChange={(page) => navigate(`/main?tab=${encodeURIComponent(page)}`)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m-9 8h12" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold">
                  {isAdminMode ? 'Competition Submissions' : 'My Submissions'}
                </h1>
                <p className="text-white/70 text-sm">
                  {isAdminMode ? 'Review and evaluate participant submissions' : 'Track statuses, scores and feedback'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">{error}</div>
        )}

        {!loading && !error && subs.length === 0 && (
          <div className="text-center py-16 text-white/70">
            {isAdminMode ? 'No submissions for this competition yet' : 'No submissions yet'}
          </div>
        )}

        {/* List */}
        {!loading && !error && subs.length > 0 && (
          <div className="grid gap-4">
            {subs.map((s) => {
              const statusText = (s.status || '').replace(/_/g, ' ') || '—';
              const d = drafts[s.id] || primeDraft(s);
              const comp = s.competition || {};
              const usr = s.user || {};

              return (
                <div key={s.id} className="bg-white/10 rounded-xl p-4 border border-white/20 space-y-4">
                  {/* Top row: Title + current status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-white font-semibold">
                        {s.title || s.project_title || 'Untitled Project'}
                      </div>
                      <div className="text-white/60 text-sm">
                        {comp.title || s.competition_title || '—'}
                        {isAdminMode && (usr.name || usr.email) ? ` • by ${usr.name || usr.email}` : ''}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded ${chip(s.status)} text-xs font-medium`}>
                      {statusText}{s.final_score != null ? ` • ${Number(s.final_score).toFixed(2)}` : ''}
                    </div>
                  </div>

                  {/* 1) Competition Details */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-white/80 font-semibold mb-2">Competition</div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-white/70">
                      <div><span className="text-white/60">Title:</span> {comp.title || '—'}</div>
                      <div><span className="text-white/60">Sponsor:</span> {comp.sponsor || '—'}</div>
                      <div><span className="text-white/60">Location:</span> {comp.location || '—'}</div>
                      <div><span className="text-white/60">Start:</span> {formatDate(comp.start_date)}</div>
                      <div><span className="text-white/60">End:</span> {formatDate(comp.end_date)}</div>
                      {Array.isArray(comp.tags) && comp.tags.length > 0 && (
                        <div className="col-span-full">
                          <span className="text-white/60">Tags:</span>{' '}
                          {comp.tags.map((t, i) => (
                            <span key={i} className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-200 rounded text-xs mr-1">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {comp.description && (
                      <p className="text-white/70 text-sm mt-2">{comp.description}</p>
                    )}
                  </div>

                  {/* 2) Participant (User) Details */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-white/80 font-semibold mb-2">Participant</div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-white/70">
                      <div><span className="text-white/60">Name:</span> {usr.name || '—'}</div>
                      <div><span className="text-white/60">Email:</span> {usr.email || '—'}</div>
                      <div><span className="text-white/60">User ID:</span> {usr.id || usr._id || '—'}</div>
                      {usr.phone && <div><span className="text-white/60">Phone:</span> {usr.phone}</div>}
                      {usr.org && <div><span className="text-white/60">Organization:</span> {usr.org}</div>}
                      {usr.country && <div><span className="text-white/60">Country:</span> {usr.country}</div>}
                    </div>
                  </div>

                  {/* 3) Submission Data */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-white/80 font-semibold mb-2">Submission</div>

                    {s.summary && (
                      <p className="text-white/80 text-sm mb-3">{s.summary}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm">
                      {s.repo_url && (
                        <a className="underline text-white/80" href={s.repo_url} target="_blank" rel="noreferrer">
                          Repo
                        </a>
                      )}
                      {s.drive_url && (
                        <a className="underline text-white/80" href={s.drive_url} target="_blank" rel="noreferrer">
                          Drive
                        </a>
                      )}
                      {s.video_url && (
                        <a
                          className="underline text-white/80"
                          href={s.video_url}
                          onClick={(e) => { e.preventDefault(); goToVideo(s); }}
                        >
                          Video
                        </a>
                      )}
                      {s.zip_url && (
                        <a className="underline text-white/80" href={s.zip_url} target="_blank" rel="noreferrer">
                          Zip
                        </a>
                      )}
                      {Array.isArray(s.attachments) && s.attachments.length > 0 && (
                        <span className="text-white/60">
                          • {s.attachments.length} attachment{ s.attachments.length > 1 ? 's' : '' }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4) Feedback (read-only for user; editable for admin) */}
                  {(!isAdminMode && s.feedback) && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/85">
                      <span className="font-semibold">Feedback:</span> {s.feedback}
                    </div>
                  )}

                  {/* 5) Evaluate (Admin only) */}
                  {isAdminMode && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-white/80 font-semibold mb-3">Evaluate</div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        {/* Status */}
                        <div>
                          <label className="block text-xs text-white/60 mb-1">Status</label>
                          <select
                            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white"
                            value={d.status}
                            onChange={(e) => updateDraft(s.id, { status: e.target.value })}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>

                        {/* Score */}
                        <div>
                          <label className="block text-xs text-white/60 mb-1">Final Score</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 87.5"
                            value={d.final_score}
                            onChange={(e) => updateDraft(s.id, { final_score: e.target.value })}
                            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50"
                          />
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="mt-3">
                        <label className="block text-xs text-white/60 mb-1">Feedback</label>
                        <textarea
                          rows={3}
                          value={d.feedback}
                          onChange={(e) => updateDraft(s.id, { feedback: e.target.value })}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 resize-y"
                          placeholder="Write feedback for the participant…"
                        />
                      </div>

                      {/* Actions & errors */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => saveEvaluation(s)}
                          disabled={d.saving}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            d.saving
                              ? 'bg-white/10 border-white/20 text-white/70'
                              : 'bg-white/20 hover:bg-white/30 border-white/20 text-white'
                          }`}
                        >
                          {d.saving ? 'Saving…' : 'Save Evaluation'}
                        </button>
                        {d.err && <span className="text-red-300 text-sm">{d.err}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
