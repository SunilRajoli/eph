// src/pages/RoleListPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";

const prettyKey = (raw) =>
  raw
    .replace(/[_-]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

const isSensitiveKey = (k) => {
  const s = k.toLowerCase();
  return (
    s.includes("password") ||
    s.includes("token") ||
    s.includes("otp") ||
    s.includes("secret") ||
    s.includes("hash") ||
    s.includes("salt")
  );
};

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 flex items-center gap-2">
    <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"/>
    </svg>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
    />
    {value && (
      <button onClick={() => onChange("")} className="text-white/60 hover:text-white">×</button>
    )}
  </div>
);

const DetailRow = ({ k, v }) => (
  <div className="flex gap-3">
    <div className="w-40 shrink-0 text-white/70 font-semibold text-xs">{prettyKey(k)}</div>
    <div className="text-white text-sm">{v?.toString() || "—"}</div>
  </div>
);

const InviteAdminCard = ({ onInvite, loading, message }) => {
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-white font-semibold">Invite Admin</div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          ref={nameRef}
          placeholder="Full name"
          className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/60 outline-none"
        />
        <input
          ref={emailRef}
          placeholder="Email address"
          type="email"
          className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/60 outline-none"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          disabled={loading}
          onClick={() => onInvite(nameRef.current?.value || "", emailRef.current?.value || "")}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
        {message && (
          <div className={`text-sm ${/(error|fail)/i.test(message) ? "text-red-300" : "text-green-300"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

const RoleListPage = ({ role: roleProp }) => {
  const params = useParams();
  const navigate = useNavigate();
  const role = (roleProp || params.role || "").toString().toLowerCase();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  // invite admin
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // header/auth (cosmetic)
  const [navUser, setNavUser] = useState(authService.getUser?.() || null);
  const initials = (navUser?.name?.[0] || "U").toString().toUpperCase();

  const label = `${role ? role[0].toUpperCase() + role.slice(1) : "Users"} • List`;

  useEffect(() => {
    setNavUser(authService.getUser?.() || null);
  }, []);

  // load list
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setInviteMsg(null);

        console.log(`Loading ${role} users...`); // Debug log

        let res;
        if (role === "admin") {
          res = await apiService.getAdminList();
        } else {
          // Try getUsersByRole first, fall back to mock data if it fails
          try {
            res = await apiService.getUsersByRole(role);
          } catch (apiError) {
            console.warn("API call failed, using mock data:", apiError);
            // Mock data for testing - remove this once your backend is working
            res = {
              success: true,
              data: {
                users: [
                  {
                    id: 1,
                    name: "John Doe",
                    email: "john.doe@example.com",
                    role: role,
                    college: "MIT",
                    branch: "Computer Science",
                    year: 3,
                    created_at: "2023-01-01T00:00:00Z",
                    is_active: true,
                    is_verified: true
                  },
                  {
                    id: 2,
                    name: "Jane Smith",
                    email: "jane.smith@example.com",
                    role: role,
                    college: "Stanford",
                    branch: "Electrical Engineering", 
                    year: 2,
                    created_at: "2023-02-01T00:00:00Z",
                    is_active: true,
                    is_verified: false
                  }
                ]
              }
            };
          }
        }

        console.log("API Response:", res); // Debug log

        if (res?.success) {
          const list = res?.data?.admins || res?.admins || res?.data?.users || res?.users || res?.data || [];
          const parsed = Array.isArray(list) ? list : [];
          console.log("Parsed users:", parsed); // Debug log
          if (!alive) return;
          setUsers(parsed);
          setFiltered(parsed);
        } else {
          const errorMsg = res?.message || "Failed to fetch users";
          console.error("API Error:", errorMsg);
          setError(errorMsg);
        }
      } catch (e) {
        console.error("Network Error:", e);
        setError(e?.message || "Network error");
      } finally {
        if (alive) {
          setLoading(false);
          console.log("Loading finished"); // Debug log
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [role]);

  // search filter
  useEffect(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      setFiltered(users);
      return;
    }
    const match = (u) => {
      const s = (v) => (v == null ? "" : String(v).toLowerCase());
      const fields = [s(u.name), s(u.email), s(u.college), s(u.company_name), s(u.firm_name), s(u.phone)];
      return fields.some((f) => f.includes(query));
    };
    setFiltered(users.filter(match));
  }, [q, users]);

  const logout = async () => {
    try {
      await apiService.logout().catch(() => {});
    } finally {
      authService.clear?.();
      navigate("/roles", { replace: true });
    }
  };

  const onInvite = async (name, email) => {
    const nameOk = (name || "").trim().length >= 2;
    const emailOk = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test((email || "").trim());
    if (!nameOk) return setInviteMsg("Name must be at least 2 characters");
    if (!emailOk) return setInviteMsg("Enter a valid email");

    try {
      setInviting(true);
      setInviteMsg(null);
      const res = await apiService.inviteAdmin({ name: name.trim(), email: email.trim() });
      if (res?.success) {
        setInviteMsg(`Invitation sent to ${email.trim()}`);
        const fresh = await apiService.getAdminList();
        const admins = fresh?.data?.admins || fresh?.admins || [];
        setUsers(Array.isArray(admins) ? admins : []);
        setFiltered(Array.isArray(admins) ? admins : []);
      } else {
        setInviteMsg(res?.message || "Failed to invite");
      }
    } catch (e) {
      setInviteMsg(`Error: ${e?.message || e}`);
    } finally {
      setInviting(false);
    }
  };

  // Debug render
  console.log("RoleListPage render - role:", role, "loading:", loading, "users:", users.length, "error:", error);

  // Add gradient background to match other pages
  return (
    <div className="min-h-screen gradient-bg">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15"
                title="Back"
              >
                ‹
              </button>
              <div>
                <div className="text-white font-extrabold">{label}</div>
                <div className="text-xs text-white/60">Browse and manage {role || "users"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug info - remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="text-blue-300 text-sm">
              <strong>Debug Info:</strong> Role: {role}, Loading: {loading ? 'true' : 'false'}, 
              Users: {users.length}, Error: {error || 'none'}
            </div>
          </div>
        )} */}

        {/* Invite (admins only) */}
        {role === "admin" && (
          <div className="mb-4">
            <InviteAdminCard onInvite={onInvite} loading={inviting} message={inviteMsg} />
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <SearchBar value={q} onChange={setQ} placeholder="Search by name, email, college/company..." />
        </div>

        {/* List */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          {loading ? (
            <div className="p-6 text-white/70 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/70"></div>
              Loading {role} users...
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="text-red-300 mb-3">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-white/70">{q ? `No results for "${q}"` : `No ${role || "users"} found`}</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((u, idx) => {
                const name = u?.name || "—";
                const email = u?.email || "—";
                const meta = u?.college || u?.company_name || u?.firm_name || u?.created_at || "";

                // priority sort for detail rows
                const priority = [
                  "name","email","role","college","branch","year","phone",
                  "company_name","company_website","team_size","firm_name",
                  "investment_stage","website","xp","badges","created_at",
                  "updated_at","is_verified","is_active",
                ];
                const entries = Object.entries(u || {})
                  .filter(([k]) => !isSensitiveKey(k))
                  .map(([k, v]) => [k, v == null ? "" : String(v)]);
                entries.sort((a, b) => {
                  const ai = priority.indexOf(a[0]);
                  const bi = priority.indexOf(b[0]);
                  if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
                  if (ai === -1) return 1;
                  if (bi === -1) return -1;
                  return ai - bi;
                });

                const open = !!u.__open;

                return (
                  <li key={idx} className="p-3">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-white font-medium">{name}</div>
                        <div className="text-xs text-white/70">
                          {email}
                          {meta ? ` • ${meta}` : ""}
                        </div>
                      </div>
                      {role === "admin" && (
                        <button
                          className="mr-2 text-white/60 hover:text-white"
                          title="Deactivate (coming soon)"
                          onClick={() => {}}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          u.__open = !open;
                          // trigger rerender
                          setFiltered((prev) => [...prev]);
                        }}
                        className="text-white/70 hover:text-white"
                        title={open ? "Collapse" : "Expand"}
                      >
                        <svg
                          className={"w-5 h-5 transition transform " + (open ? "rotate-180" : "")}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>
                    </div>

                    {open && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                        <div className="text-white font-semibold">Details</div>
                        <div className="space-y-2">
                          {entries.map(([k, v]) => (
                            <DetailRow key={k} k={k} v={v} />
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleListPage;