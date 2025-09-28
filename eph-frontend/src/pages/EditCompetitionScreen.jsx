// src/pages/EditCompetitionScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';
import CustomButton from '../components/CustomButton';

const EditCompetitionScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const isAdmin = useMemo(() => (user?.role || '').toLowerCase() === 'admin', [user]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sponsor: '',
    sourceType: '',
    maxTeamSize: '1',
    seatsRemaining: '100',
    tags: '',
    stages: 'registration,submission,evaluation', // text input; we’ll parse on submit
    eligibilityCriteria: '', // can be plain text or JSON
    contactInfo: '', // can be plain text or JSON
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /* ---------- helpers ---------- */
  const toISODateOnly = (d) => {
    if (!d) return '';
    try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
  };

  // Normalize stages from API (array of strings or array of objects) to a nice comma list.
  const stagesToText = (stages) => {
    if (!stages) return '';
    if (typeof stages === 'string') {
      // If API already returns JSON text, try parsing; otherwise use as-is
      try {
        const parsed = JSON.parse(stages);
        return stagesToText(parsed);
      } catch {
        return stages;
      }
    }
    if (Array.isArray(stages)) {
      const parts = stages.map((s) => {
        if (typeof s === 'string') return s;
        if (s && typeof s === 'object') {
          return s.name || s.title || s.label || s.stage || JSON.stringify(s);
        }
        return String(s);
      });
      return parts.join(',');
    }
    // Fallback for odd values
    try { return JSON.stringify(stages); } catch { return String(stages); }
  };

  // Show eligibility/contact as-is if plain text; pretty-print if they’re JSON.
  const normalizeFreeOrJSONForInput = (val) => {
    if (val == null) return '';
    if (typeof val === 'string') {
      const t = val.trim();
      if (!t) return '';
      try {
        const parsed = JSON.parse(t);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return val; // plain text string
      }
    }
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  };

  // On submit: if it looks like JSON ({ or [) and is valid, send parsed object/array.
  // Else send plain string.
  const maybeJSON = (txt) => {
    const t = (txt || '').trim();
    if (!t) return undefined; // omit from payload
    if (t.startsWith('{') || t.startsWith('[')) {
      try { return JSON.parse(t); } catch { /* fall through to string */ }
    }
    return t; // plain text
  };

  // Parse stages input: allow comma list OR JSON array.
  const parseStagesInput = (txt) => {
    const t = (txt || '').trim();
    if (!t) return ['registration', 'submission', 'evaluation'];
    if (t.startsWith('[')) {
      try {
        const arr = JSON.parse(t);
        if (Array.isArray(arr)) {
          return arr.map((x) =>
            typeof x === 'string' ? x : (x?.name || x?.title || x?.label || x?.stage || JSON.stringify(x))
          ).filter(Boolean);
        }
      } catch { /* fallback to comma split */ }
    }
    return t.split(',').map((s) => s.trim()).filter(Boolean);
  };
  /* ---------------------------- */

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/main');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getCompetition(id);
        const c = res?.data?.competition ?? res?.competition;
        if (!c) throw new Error('Competition not found');

        setFormData({
          title: c.title || '',
          description: c.description || c.subtitle || '',
          sponsor: c.sponsor || '',
          sourceType: c.source_type || c.content_source_type || c.source || '',
          maxTeamSize: String(c.max_team_size || c.team_size || 1),
          seatsRemaining: String(c.seats_remaining ?? c.total_seats ?? c.seats ?? 100),
          tags: Array.isArray(c.tags) ? c.tags.join(',') : (c.tags || ''),
          stages: stagesToText(c.stages) || 'registration,submission,evaluation',
          eligibilityCriteria: normalizeFreeOrJSONForInput(c.eligibility_criteria),
          contactInfo: normalizeFreeOrJSONForInput(c.contact_info),
        });
        setStartDate(toISODateOnly(c.start_date));
        setEndDate(toISODateOnly(c.end_date));
      } catch (e) {
        setError(e.message || 'Failed to load competition');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated, isAdmin, navigate]);

  const validateForm = () => {
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters'); return false;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters'); return false;
    }
    if (!startDate || !endDate) {
      setError('Please select start and end dates'); return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date'); return false;
    }
    const maxTeam = parseInt(formData.maxTeamSize, 10);
    if (isNaN(maxTeam) || maxTeam < 1) {
      setError('Max team size must be at least 1'); return false;
    }
    const seats = parseInt(formData.seatsRemaining, 10);
    if (isNaN(seats) || seats < 0) {
      setError('Seats available cannot be negative'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        sponsor: formData.sponsor.trim() || null,
        source_type: formData.sourceType.trim() || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        max_team_size: parseInt(formData.maxTeamSize, 10),
        seats_remaining: parseInt(formData.seatsRemaining, 10),
        stages: parseStagesInput(formData.stages),
        tags: formData.tags.trim()
          ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const eligibility = maybeJSON(formData.eligibilityCriteria);
      if (eligibility !== undefined) payload.eligibility_criteria = eligibility;

      const contact = maybeJSON(formData.contactInfo);
      if (contact !== undefined) payload.contact_info = contact;

      const res = await apiService.makeRequest(`/competitions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        navigate(-1, { state: { refreshCompetitions: true } });
      } else {
        setError(res?.message || 'Update failed');
      }
    } catch (err) {
      setError(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout
      currentPage="competitions"
      onPageChange={(page) => navigate(`/main?tab=${encodeURIComponent(page)}`)}
    >
      <div className="p-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
          </div>
        )}

        {/* Error (failed to load) */}
        {!loading && error && (
          <div className="p-6 max-w-lg">
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 text-center">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <p className="text-white/70 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && (
          <>
            {/* Header (glass) */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Edit Competition</h1>
                    <p className="text-white/70 text-sm">Update competition details</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form (glass) */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block font-medium mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4m-4 4h4m5-12v16" />
                    </svg>
                    <input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter competition title"
                      className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-medium mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Enter detailed description of the competition"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Sponsor & Source Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">Sponsor (Optional)</label>
                    <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <input
                        value={formData.sponsor}
                        onChange={(e) => handleInputChange('sponsor', e.target.value)}
                        placeholder="Competition sponsor"
                        className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Source Type (Optional)</label>
                    <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
                      </svg>
                      <input
                        value={formData.sourceType}
                        onChange={(e) => handleInputChange('sourceType', e.target.value)}
                        placeholder="e.g., External, Internal"
                        className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Team size & Seats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">
                      Max Team Size <span className="text-red-400">*</span>
                    </label>
                    <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <input
                        type="number"
                        value={formData.maxTeamSize}
                        onChange={(e) => handleInputChange('maxTeamSize', e.target.value)}
                        placeholder="1"
                        className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-2">
                      Seats Available <span className="text-red-400">*</span>
                    </label>
                    <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 0 0 118 0z" />
                      </svg>
                      <input
                        type="number"
                        value={formData.seatsRemaining}
                        onChange={(e) => handleInputChange('seatsRemaining', e.target.value)}
                        placeholder="100"
                        className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">
                      Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">
                      End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block font-medium mb-2">Tags (comma-separated)</label>
                  <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <input
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="e.g., programming, hackathon, AI, web-dev"
                      className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                    />
                  </div>
                </div>

                {/* Stages */}
                <div>
                  <label className="block font-medium mb-2">Stages (comma-separated or JSON array)</label>
                  <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <input
                      value={formData.stages}
                      onChange={(e) => handleInputChange('stages', e.target.value)}
                      placeholder='registration, submission, evaluation   or   ["registration","submission"]'
                      className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
                    />
                  </div>
                </div>

                {/* Eligibility (plain text OR JSON) */}
                <div>
                  <label className="block font-medium mb-2">Eligibility Criteria (plain text or JSON)</label>
                  <textarea
                    placeholder='Examples:  "student, only final year"   or   {"studentOnly": true, "year": "final"}'
                    value={formData.eligibilityCriteria}
                    onChange={(e) => handleInputChange('eligibilityCriteria', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>

                {/* Contact (plain text OR JSON) */}
                <div>
                  <label className="block font-medium mb-2">Contact Info (plain text or JSON)</label>
                  <textarea
                    placeholder='Examples:  "csclub@university.edu"   or   {"email":"csclub@university.edu","phone":"+1234567890"}'
                    value={formData.contactInfo}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <CustomButton
                  type="submit"
                  text={submitting ? 'Saving Changes...' : 'Save Changes'}
                  enabled={!submitting}
                  loading={submitting}
                />
              </form>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
};

export default EditCompetitionScreen;
