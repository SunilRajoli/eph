// // src/pages/CreateCompetitionScreen.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { apiService } from '../services/apiService';
// import SidebarLayout from '../components/SidebarLayout';
// import CustomButton from '../components/CustomButton';

// const CreateCompetitionScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user, isAuthenticated } = useAuth();

//   const competitionToEdit = location.state?.competition;
//   const isEdit = !!competitionToEdit;

//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     sponsor: '',
//     maxTeamSize: '1',
//     seatsRemaining: '100',
//     tags: '',
//     stages: 'registration,submission,evaluation',
//     eligibilityCriteria: '', // <- empty string (no {})
//     contactInfo: '',         // <- empty string (no {})
//   });

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   // Prefill if editing
//   useEffect(() => {
//     if (!isEdit || !competitionToEdit) return;
//     const c = competitionToEdit;

//     setFormData(prev => ({
//       ...prev,
//       title: c.title || '',
//       description: c.description || c.subtitle || '',
//       sponsor: c.sponsor || '',
//       maxTeamSize: String(c.max_team_size ?? c.team_size ?? 1),
//       seatsRemaining: String(c.seats_remaining ?? c.total_seats ?? c.seats ?? 100),
//       tags: Array.isArray(c.tags) ? c.tags.join(',') : (c.tags || ''),
//       stages: Array.isArray(c.stages) ? c.stages.join(',') : (c.stages || 'registration,submission,evaluation'),
//       eligibilityCriteria: c.eligibility_criteria ? JSON.stringify(c.eligibility_criteria, null, 2) : '',
//       contactInfo: c.contact_info ? JSON.stringify(c.contact_info, null, 2) : '',
//     }));

//     if (c.start_date) setStartDate(new Date(c.start_date).toISOString().split('T')[0]);
//     if (c.end_date) setEndDate(new Date(c.end_date).toISOString().split('T')[0]);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isEdit]);

//   // Admin guard
//   useEffect(() => {
//     if (!isAuthenticated || user?.role?.toLowerCase() !== 'admin') {
//       navigate('/main');
//     }
//   }, [isAuthenticated, user, navigate]);

//   const onChangeField = (field) => (e) => {
//     const value = e.target.value;
//     // update only that field to avoid re-creating inputs
//     setFormData(prev => (prev[field] === value ? prev : { ...prev, [field]: value }));
//   };

//   const parseJsonIfProvided = (text) => {
//     const trimmed = (text || '').trim();
//     if (!trimmed) return null; // nothing provided
//     try {
//       return JSON.parse(trimmed);
//     } catch {
//       return '__INVALID__';
//     }
//   };

//   const validate = () => {
//     if (!formData.title.trim() || formData.title.trim().length < 3) {
//       setError('Title must be at least 3 characters');
//       return false;
//     }
//     if (!formData.description.trim() || formData.description.trim().length < 10) {
//       setError('Description must be at least 10 characters');
//       return false;
//     }
//     if (!startDate || !endDate) {
//       setError('Please select start and end dates');
//       return false;
//     }
//     if (new Date(endDate) <= new Date(startDate)) {
//       setError('End date must be after start date');
//       return false;
//     }
//     const maxTeam = parseInt(formData.maxTeamSize, 10);
//     if (Number.isNaN(maxTeam) || maxTeam < 1) {
//       setError('Max team size must be at least 1');
//       return false;
//     }
//     const seats = parseInt(formData.seatsRemaining, 10);
//     if (Number.isNaN(seats) || seats < 0) {
//       setError('Seats available cannot be negative');
//       return false;
//     }

//     const elig = parseJsonIfProvided(formData.eligibilityCriteria);
//     if (elig === '__INVALID__') {
//       setError('Eligibility Criteria must be valid JSON or left empty');
//       return false;
//     }
//     const contact = parseJsonIfProvided(formData.contactInfo);
//     if (contact === '__INVALID__') {
//       setError('Contact Info must be valid JSON or left empty');
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setSubmitting(true);
//     setError(null);

//     try {
//       const payload = {
//         title: formData.title.trim(),
//         description: formData.description.trim(),
//         sponsor: formData.sponsor.trim() || null,
//         start_date: new Date(startDate).toISOString(),
//         end_date: new Date(endDate).toISOString(),
//         max_team_size: parseInt(formData.maxTeamSize, 10),
//         seats_remaining: parseInt(formData.seatsRemaining, 10),
//         total_seats: parseInt(formData.seatsRemaining, 10),
//         stages: formData.stages.trim()
//           ? formData.stages.split(',').map(s => s.trim()).filter(Boolean)
//           : ['registration', 'submission', 'evaluation'],
//         tags: formData.tags.trim()
//           ? formData.tags.split(',').map(s => s.trim()).filter(Boolean)
//           : [],
//       };

//       const elig = parseJsonIfProvided(formData.eligibilityCriteria);
//       if (elig && elig !== '__INVALID__') payload.eligibility_criteria = elig;

//       const contact = parseJsonIfProvided(formData.contactInfo);
//       if (contact && contact !== '__INVALID__') payload.contact_info = contact;

//       let response;
//       if (isEdit) {
//         const id = competitionToEdit.id || competitionToEdit._id;
//         response = await apiService.makeRequest(`/competitions/${id}`, {
//           method: 'PUT',
//           body: JSON.stringify(payload),
//         });
//       } else {
//         response = await apiService.makeRequest('/competitions', {
//           method: 'POST',
//           body: JSON.stringify(payload),
//         });
//       }

//       if (response.success) {
//         navigate(-1, { state: { refreshCompetitions: true } });
//       } else {
//         setError(response.message || `${isEdit ? 'Update' : 'Creation'} failed`);
//       }
//     } catch (err) {
//       setError(err.message || 'Network error occurred');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
//       <div className="p-6">
//         {/* Header */}
//         <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
//                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-lg font-bold">{isEdit ? 'Edit Competition' : 'Create Competition'}</h1>
//                 <p className="text-white/70 text-sm">
//                   {isEdit ? 'Update competition details' : 'Set up a new competition'}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => navigate(-1)}
//               className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
//               aria-label="Close"
//             >
//               <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Form */}
//         <div className="bg-white/10 rounded-xl p-6 border border-white/20">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Title */}
//             <div>
//               <label className="block font-medium mb-2">
//                 Title <span className="text-red-400">*</span>
//               </label>
//               <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4m-4 4h4m5-12v16" />
//                 </svg>
//                 <input
//                   required
//                   value={formData.title}
//                   onChange={onChangeField('title')}
//                   placeholder="Enter competition title"
//                   className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                 />
//               </div>
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block font-medium mb-2">
//                 Description <span className="text-red-400">*</span>
//               </label>
//               <textarea
//                 required
//                 rows={4}
//                 placeholder="Enter detailed description of the competition"
//                 value={formData.description}
//                 onChange={onChangeField('description')}
//                 className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
//               />
//             </div>

//             {/* Sponsor / Source Type */}
//               <div>
//                 <label className="block font-medium mb-2">Sponsor (Optional)</label>
//                 <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                   </svg>
//                   <input
//                     value={formData.sponsor}
//                     onChange={onChangeField('sponsor')}
//                     placeholder="Competition sponsor"
//                     className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   />
//                 </div>
//               {/* <div>
//                 <label className="block font-medium mb-2">Source Type (Optional)</label>
//                 <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.94-6.071-2.466C3.73 10.7 3.73 7.3 5.929 5.466A7.962 7.962 0 0112 3c2.34 0 4.5.94 6.071 2.466C20.27 7.3 20.27 10.7 18.071 12.534A7.962 7.962 0 0112 15z" />
//                   </svg>
//                   <input
//                     value={formData.sourceType}
//                     onChange={onChangeField('sourceType')}
//                     placeholder="e.g., External, Internal"
//                     className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   />
//                 </div>
//               </div> */}
//             </div>

//             {/* Max Team / Seats */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block font-medium mb-2">
//                   Max Team Size <span className="text-red-400">*</span>
//                 </label>
//                 <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                   </svg>
//                   <input
//                     type="number"
//                     min={1}
//                     required
//                     value={formData.maxTeamSize}
//                     onChange={onChangeField('maxTeamSize')}
//                     placeholder="1"
//                     className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block font-medium mb-2">
//                   Seats Available <span className="text-red-400">*</span>
//                 </label>
//                 <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 0 0 118 0z" />
//                   </svg>
//                   <input
//                     type="number"
//                     min={0}
//                     required
//                     value={formData.seatsRemaining}
//                     onChange={onChangeField('seatsRemaining')}
//                     placeholder="100"
//                     className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Dates */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block font-medium mb-2">
//                   Start Date <span className="text-red-400">*</span>
//                 </label>
//                 <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm0-10h14" />
//                   </svg>
//                   <input
//                     type="date"
//                     required
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                     className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block font-medium mb-2">
//                   End Date <span className="text-red-400">*</span>
//                 </label>
//                 <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                   <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm0-10h14" />
//                   </svg>
//                   <input
//                     type="date"
//                     required
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                     className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Tags */}
//             <div>
//               <label className="block font-medium mb-2">Tags (comma-separated)</label>
//               <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
//                 </svg>
//                 <input
//                   value={formData.tags}
//                   onChange={onChangeField('tags')}
//                   placeholder="e.g., programming, hackathon, AI, web-dev"
//                   className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                 />
//               </div>
//             </div>

//             {/* Stages */}
//             <div>
//               <label className="block font-medium mb-2">Stages (comma-separated)</label>
//               <div className="inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-white/10 border border-white/10 w-full">
//                 <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                 </svg>
//                 <input
//                   value={formData.stages}
//                   onChange={onChangeField('stages')}
//                   placeholder="e.g., registration, submission, evaluation, results"
//                   className="flex-1 bg-transparent outline-none text-white placeholder-white/60 h-full"
//                 />
//               </div>
//             </div>

//             {/* Eligibility (JSON) */}
//             <div>
//               <label className="block font-medium mb-2">Eligibility Criteria (JSON)</label>
//               <textarea
//                 rows={4}
//                 placeholder='{"minAge": 18, "education": "College student"}'
//                 value={formData.eligibilityCriteria}
//                 onChange={onChangeField('eligibilityCriteria')}
//                 className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none font-mono text-sm"
//               />
//             </div>

//             {/* Contact (JSON) */}
//             <div>
//               <label className="block font-medium mb-2">Contact Info (JSON)</label>
//               <textarea
//                 rows={3}
//                 placeholder='{"email": "contact@competition.com", "phone": "+1234567890"}'
//                 value={formData.contactInfo}
//                 onChange={onChangeField('contactInfo')}
//                 className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none font-mono text-sm"
//               />
//             </div>

//             {/* Error */}
//             {error && (
//               <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
//                 <div className="flex items-center gap-3">
//                   <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                   </svg>
//                   <p className="text-red-400">{error}</p>
//                 </div>
//               </div>
//             )}

//             {/* Submit */}
//             <CustomButton
//               type="submit"
//               text={
//                 submitting
//                   ? (isEdit ? 'Saving Changes...' : 'Creating Competition...')
//                   : (isEdit ? 'Save Changes' : 'Create Competition')
//               }
//               enabled={!submitting}
//               loading={submitting}
//             />

//             {/* Cancel */}
//             <div className="text-center">
//               <button
//                 type="button"
//                 onClick={() => navigate(-1)}
//                 className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// };

// export default CreateCompetitionScreen;


// src/pages/CreateCompetitionScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import SidebarLayout from '../components/SidebarLayout';
import CustomButton from '../components/CustomButton';

const emptyPrize = { place: '', amount: '' };
const emptyResource = { label: '', url: '' };

const CreateCompetitionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const competitionToEdit = location.state?.competition || null;
  const isEdit = !!competitionToEdit;

  // --- Core fields ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [locationField, setLocationField] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState('1');
  const [seatsRemaining, setSeatsRemaining] = useState('100');
  const [tagsText, setTagsText] = useState('');
  const [stagesText, setStagesText] = useState('registration,submission,evaluation');
  const [prizePool, setPrizePool] = useState('');

  // --- Timeline fields ---
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultsDate, setResultsDate] = useState('');

  // --- Structured fields (UI > JSON under the hood) ---
  const [eligibility, setEligibility] = useState({
    minAge: '',
    maxAge: '',
    education: '',
    countriesAllowed: '', // comma-separated in UI; array in payload
  });

  const [contact, setContact] = useState({
    email: '',
    phone: '',
    website: '',
    discord: '',
  });

  const [prizes, setPrizes] = useState([{ ...emptyPrize }]);
  const [resources, setResources] = useState([{ ...emptyResource }]);

  // --- Rules (Markdown or plain) ---
  const [rulesMarkdown, setRulesMarkdown] = useState('');

  // misc
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Prefill if editing
  useEffect(() => {
    if (!isEdit || !competitionToEdit) return;
    const c = competitionToEdit;

    setTitle(c.title || '');
    setDescription(c.description || '');
    setSponsor(c.sponsor || '');
    setLocationField(c.location || '');
    setBannerUrl(c.banner_image_url || '');
    setMaxTeamSize(String(c.max_team_size ?? 1));
    setSeatsRemaining(String(c.seats_remaining ?? c.total_seats ?? 100));
    setTagsText(Array.isArray(c.tags) ? c.tags.join(',') : (c.tags || ''));
    setStagesText(Array.isArray(c.stages) ? c.stages.join(',') : (c.stages || 'registration,submission,evaluation'));
    setPrizePool(c.prize_pool ? String(c.prize_pool) : '');

    if (c.start_date) setStartDate(new Date(c.start_date).toISOString().split('T')[0]);
    if (c.end_date) setEndDate(new Date(c.end_date).toISOString().split('T')[0]);

    // New timeline fields if present
    if (c.registration_start_date) setRegistrationStartDate(new Date(c.registration_start_date).toISOString().split('T')[0]);
    if (c.registration_deadline) setRegistrationDeadline(new Date(c.registration_deadline).toISOString().split('T')[0]);
    if (c.results_date) setResultsDate(new Date(c.results_date).toISOString().split('T')[0]);

    // Structured: eligibility/contact/prizes/resources/rulesMarkdown
    if (c.eligibility_criteria && typeof c.eligibility_criteria === 'object') {
      const ec = c.eligibility_criteria || {};
      setEligibility({
        minAge: ec.minAge ?? '',
        maxAge: ec.maxAge ?? '',
        education: ec.education ?? '',
        countriesAllowed: Array.isArray(ec.countriesAllowed) ? ec.countriesAllowed.join(',') : (ec.countriesAllowed || ''),
      });
    }
    if (c.contact_info && typeof c.contact_info === 'object') {
      const ci = c.contact_info || {};
      setContact({
        email: ci.email ?? '',
        phone: ci.phone ?? '',
        website: ci.website ?? '',
        discord: ci.discord ?? '',
      });
    }
    if (Array.isArray(c.prizes_json) && c.prizes_json.length) setPrizes(c.prizes_json.map(p => ({ place: p.place ?? '', amount: String(p.amount ?? '') })));
    if (Array.isArray(c.resources_json) && c.resources_json.length) setResources(c.resources_json.map(r => ({ label: r.label ?? '', url: r.url ?? '' })));
    if (c.rules_markdown) setRulesMarkdown(c.rules_markdown);
    else if (c.rules) setRulesMarkdown(c.rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // Admin guard
  useEffect(() => {
    if (!isAuthenticated || user?.role?.toLowerCase() !== 'admin') {
      navigate('/main');
    }
  }, [isAuthenticated, user, navigate]);

  // helpers
  const addPrize = () => setPrizes(prev => [...prev, { ...emptyPrize }]);
  const removePrize = (idx) => setPrizes(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const updatePrize = (idx, key, val) => setPrizes(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));

  const addResource = () => setResources(prev => [...prev, { ...emptyResource }]);
  const removeResource = (idx) => setResources(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const updateResource = (idx, key, val) => setResources(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));

  const tagsArray = useMemo(
    () => (tagsText.trim() ? tagsText.split(',').map(s => s.trim()).filter(Boolean) : []),
    [tagsText]
  );
  const stagesArray = useMemo(
    () => (stagesText.trim() ? stagesText.split(',').map(s => s.trim()).filter(Boolean) : []),
    [stagesText]
  );

  const validate = () => {
    if (!title.trim() || title.trim().length < 3) return setError('Title must be at least 3 characters'), false;
    if (!description.trim() || description.trim().length < 10) return setError('Description must be at least 10 characters'), false;

    if (!startDate || !endDate) return setError('Please select start and end dates'), false;
    if (new Date(endDate) <= new Date(startDate)) return setError('End date must be after start date'), false;

    if (registrationStartDate && new Date(registrationStartDate) > new Date(startDate)) {
      return setError('Registration start must be on/before competition start'), false;
    }
    if (registrationDeadline && new Date(registrationDeadline) > new Date(startDate)) {
      return setError('Registration deadline must be before competition start'), false;
    }
    if (resultsDate && new Date(resultsDate) < new Date(endDate)) {
      return setError('Results date must be on/after competition end'), false;
    }

    const m = parseInt(maxTeamSize, 10);
    if (!Number.isFinite(m) || m < 1) return setError('Max team size must be at least 1'), false;

    const s = parseInt(seatsRemaining, 10);
    if (!Number.isFinite(s) || s < 0) return setError('Seats available cannot be negative'), false;

    // Validate URLs in resources
    for (const r of resources) {
      if (r.url && !/^https?:\/\//i.test(r.url)) {
        return setError('Every Resource URL must start with http:// or https://'), false;
      }
    }
    // Validate banner url if provided
    if (bannerUrl && !/^https?:\/\//i.test(bannerUrl)) {
      return setError('Banner Image URL must start with http:// or https://'), false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sponsor: sponsor.trim() || null,
        location: locationField.trim() || null,
        banner_image_url: bannerUrl.trim() || null,

        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),

        // timeline extras (supported by your updated model/migrations)
        registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
        results_date: resultsDate ? new Date(resultsDate).toISOString() : null,

        max_team_size: parseInt(maxTeamSize, 10),
        seats_remaining: parseInt(seatsRemaining, 10),
        total_seats: parseInt(seatsRemaining, 10),

        tags: tagsArray,
        stages: stagesArray,

        // structured objects
        eligibility_criteria: {
          minAge: eligibility.minAge ? Number(eligibility.minAge) : undefined,
          maxAge: eligibility.maxAge ? Number(eligibility.maxAge) : undefined,
          education: eligibility.education || undefined,
          countriesAllowed: eligibility.countriesAllowed
            ? eligibility.countriesAllowed.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
        },

        contact_info: {
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          website: contact.website || undefined,
          discord: contact.discord || undefined,
        },

        // optional extras
        prize_pool: prizePool ? Number(prizePool) : null,
        prizes_json: prizes
          .map(p => ({ place: p.place?.trim(), amount: p.amount ? Number(p.amount) : undefined }))
          .filter(p => p.place || (Number.isFinite(p.amount) && p.amount >= 0)),

        resources_json: resources
          .map(r => ({ label: r.label?.trim(), url: r.url?.trim() }))
          .filter(r => r.label || r.url),

        rules_markdown: rulesMarkdown?.trim() || null,
      };

      // Clean undefineds inside nested objects (Sequelize JSONB is fine, but keep it tidy)
      if (payload.eligibility_criteria && Object.values(payload.eligibility_criteria).every(v => v === undefined)) {
        delete payload.eligibility_criteria;
      }
      if (payload.contact_info && Object.values(payload.contact_info).every(v => v === undefined)) {
        delete payload.contact_info;
      }

      // Submit
      let response;
      if (isEdit) {
        const id = competitionToEdit.id || competitionToEdit._id;
        response = await apiService.makeRequest(`/competitions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiService.makeRequest('/competitions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (response?.success) {
        navigate(-1, { state: { refreshCompetitions: true } });
      } else {
        setError(response?.message || `${isEdit ? 'Update' : 'Creation'} failed`);
      }
    } catch (err) {
      setError(err?.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout currentPage="competitions" onPageChange={() => {}}>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold">{isEdit ? 'Edit Competition' : 'Create Competition'}</h1>
                <p className="text-white/70 text-sm">
                  {isEdit ? 'Update competition details' : 'Set up a new competition'}
                </p>
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

        {/* Form */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic */}
            <section className="space-y-6">
              <div>
                <label className="block font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter competition title"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed description of the competition"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Sponsor</label>
                  <input
                    value={sponsor}
                    onChange={e => setSponsor(e.target.value)}
                    placeholder="Competition sponsor"
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Location</label>
                  <input
                    value={locationField}
                    onChange={e => setLocationField(e.target.value)}
                    placeholder="City / Online / Hybrid"
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Banner Image URL</label>
                <input
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
                />
              </div>
            </section>

            {/* Capacity */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-2">
                  Max Team Size <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={maxTeamSize}
                  onChange={e => setMaxTeamSize(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">
                  Seats Available <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={seatsRemaining}
                  onChange={e => setSeatsRemaining(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Prize Pool (optional)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={prizePool}
                  onChange={e => setPrizePool(e.target.value)}
                  placeholder="100000"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-white/90 font-semibold mb-3">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-2">Registration Opens</label>
                  <input
                    type="date"
                    value={registrationStartDate}
                    onChange={e => setRegistrationStartDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Registration Closes</label>
                  <input
                    type="date"
                    value={registrationDeadline}
                    onChange={e => setRegistrationDeadline(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Results Date</label>
                  <input
                    type="date"
                    value={resultsDate}
                    onChange={e => setResultsDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Tags & Stages */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-2">Tags (comma-separated)</label>
                <input
                  value={tagsText}
                  onChange={e => setTagsText(e.target.value)}
                  placeholder="e.g., ai,nlp,moderation"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Stages (comma-separated)</label>
                <input
                  value={stagesText}
                  onChange={e => setStagesText(e.target.value)}
                  placeholder="registration,submission,evaluation,results"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/60 outline-none"
                />
              </div>
            </section>

            {/* Eligibility */}
            <section>
              <h3 className="text-white/90 font-semibold mb-3">Eligibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-medium mb-2">Min Age</label>
                  <input
                    type="number"
                    min={0}
                    value={eligibility.minAge}
                    onChange={e => setEligibility(prev => ({ ...prev, minAge: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Max Age</label>
                  <input
                    type="number"
                    min={0}
                    value={eligibility.maxAge}
                    onChange={e => setEligibility(prev => ({ ...prev, maxAge: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium mb-2">Education</label>
                  <input
                    value={eligibility.education}
                    onChange={e => setEligibility(prev => ({ ...prev, education: e.target.value }))}
                    placeholder="e.g., Any / College students / Open"
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block font-medium mb-2">Countries Allowed (comma-separated)</label>
                  <input
                    value={eligibility.countriesAllowed}
                    onChange={e => setEligibility(prev => ({ ...prev, countriesAllowed: e.target.value }))}
                    placeholder="e.g., US, IN, UK (leave empty for global)"
                    className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-white/90 font-semibold mb-3">Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  value={contact.email}
                  onChange={e => setContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
                <input
                  value={contact.phone}
                  onChange={e => setContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
                <input
                  value={contact.website}
                  onChange={e => setContact(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="Website URL"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
                <input
                  value={contact.discord}
                  onChange={e => setContact(prev => ({ ...prev, discord: e.target.value }))}
                  placeholder="Discord invite"
                  className="w-full h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
            </section>

            {/* Prizes */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/90 font-semibold">Prizes</h3>
                <button
                  type="button"
                  onClick={addPrize}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm"
                >
                  + Add Prize
                </button>
              </div>
              <div className="space-y-3">
                {prizes.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <input
                      value={p.place}
                      onChange={e => updatePrize(idx, 'place', e.target.value)}
                      placeholder="Place (e.g., 1st)"
                      className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={p.amount}
                      onChange={e => updatePrize(idx, 'amount', e.target.value)}
                      placeholder="Amount (e.g., 35000)"
                      className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removePrize(idx)}
                        className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Resources */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/90 font-semibold">Resources</h3>
                <button
                  type="button"
                  onClick={addResource}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm"
                >
                  + Add Resource
                </button>
              </div>
              <div className="space-y-3">
                {resources.map((r, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <input
                      value={r.label}
                      onChange={e => updateResource(idx, 'label', e.target.value)}
                      placeholder="Label (e.g., Dataset, Starter Notebook)"
                      className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                    />
                    <input
                      value={r.url}
                      onChange={e => updateResource(idx, 'url', e.target.value)}
                      placeholder="https://..."
                      className="h-11 px-3 rounded-lg bg-white/10 border border-white/10 text-white outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeResource(idx)}
                        className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Rules */}
            <section>
              <h3 className="text-white/90 font-semibold mb-2">Rules (Markdown allowed)</h3>
              <textarea
                rows={10}
                placeholder="Write the competition rules here..."
                value={rulesMarkdown}
                onChange={e => setRulesMarkdown(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 outline-none resize-y"
              />
            </section>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856" />
                  </svg>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Submit/Cancel */}
            <CustomButton
              type="submit"
              text={
                submitting
                  ? (isEdit ? 'Saving Changes...' : 'Creating Competition...')
                  : (isEdit ? 'Save Changes' : 'Create Competition')
              }
              enabled={!submitting}
              loading={submitting}
            />

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CreateCompetitionScreen;
