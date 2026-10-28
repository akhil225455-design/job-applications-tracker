import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api/client.js';
import ApplicationForm from './components/ApplicationForm.jsx';
import DetailsModal from './components/DetailsModal.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import { BriefcaseBusiness, Plus, Search, SlidersHorizontal, LayoutDashboard, CalendarDays, TrendingUp, Clock3, ArrowUpRight, MoreHorizontal, RefreshCw, Sparkles, ChevronDown, CircleAlert, Building2 } from 'lucide-react';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Declined'];
const dateFmt = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const moneyFmt = (value) => value == null ? 'Not specified' : `₹${Number(value).toLocaleString('en-IN')}`;

export default function App() {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState(Object.fromEntries(STATUSES.map(s => [s, 0])));
  const [status, setStatus] = useState('All statuses');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoadError('');
      const params = new URLSearchParams();
      if (status !== 'All statuses') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const result = await api(`/applications?${params.toString()}`);
      setApplications(result.data.applications);
      setCounts(result.data.counts);
      if (selected) {
        const refreshed = result.data.applications.find(x => x._id === selected._id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (e) { setLoadError(`${e.message} Check that the backend is running and MongoDB is connected.`); }
  }, [status, search]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3200); return () => clearTimeout(t); }, [toast]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeCount = (counts.Applied || 0) + (counts.Interview || 0) + (counts.Offer || 0);
  const overdueCount = applications.filter(a => a.isOverdue).length;
  const closeForm = () => { setFormOpen(false); setEditing(null); setError(''); };
  const openAdd = () => { setEditing(null); setError(''); setFormOpen(true); };
  const openEdit = (app) => { setEditing(app); setSelected(null); setError(''); setFormOpen(true); };
  const submit = async (payload) => {
    setBusy(true); setError('');
    try {
      if (editing) await api(`/applications/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/applications', { method: 'POST', body: JSON.stringify(payload) });
      closeForm(); setToast(editing ? 'Application updated successfully.' : 'Application added successfully.'); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const changeStatus = async (id, nextStatus) => {
    setBusy(true);
    try { await api(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }); setToast(`Status updated to ${nextStatus}.`); await load(); const r = await api(`/applications/${id}`); setSelected(r.data); }
    catch (e) { setToast(e.message); }
    finally { setBusy(false); }
  };
  const deleteApplication = async (app) => {
    if (!window.confirm(`Delete ${app.applicationId} — ${app.companyName} / ${app.jobRole}? This cannot be undone.`)) return;
    setBusy(true);
    try { await api(`/applications/${app._id}`, { method: 'DELETE' }); setSelected(null); setToast('Application deleted.'); await load(); }
    catch (e) { setToast(e.message); }
    finally { setBusy(false); }
  };
  const recentLabel = useMemo(() => applications.length === 1 ? '1 application shown' : `${applications.length} applications shown`, [applications.length]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><BriefcaseBusiness size={21}/></div><div><strong>pathway<span>.</span></strong><small>CAREER WORKSPACE</small></div></div>
      <div className="side-label">WORKSPACE</div><button className="nav-item active"><LayoutDashboard size={17}/>Overview<span className="nav-indicator"/></button>
      <div className="side-label side-label-spaced">YOUR PIPELINE</div>
      {STATUSES.map((s, i) => <button key={s} className={`nav-item status-nav ${status === s ? 'selected' : ''}`} onClick={() => setStatus(status === s ? 'All statuses' : s)}><span className={`mini-status mini-${s.toLowerCase()}`}/>{s}<span className="nav-count">{counts[s] || 0}</span></button>)}
      <div className="sidebar-bottom"><div className="tip-card"><div className="tip-icon"><Sparkles size={16}/></div><strong>Small steps add up.</strong><p>Every application is progress. Keep showing up for your future.</p><span>YOU'VE GOT THIS <span>✳</span></span></div><div className="profile-row"><div className="avatar">JS</div><div><strong>Job Seeker</strong><small>Personal workspace</small></div><MoreHorizontal size={18}/></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><span className="today-chip"><CalendarDays size={14}/>{new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span><div className="top-avatar">JS</div></div></header>
      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow welcome-eyebrow"><span className="eyebrow-line"/> YOUR NEXT CHAPTER STARTS HERE</div><h1>Your career, <em>in progress.</em></h1><p className="page-subtitle">A little clarity goes a long way. Keep every opportunity moving forward.</p></div><button className="button button-primary add-main" onClick={openAdd}><Plus size={18}/> Add application</button></section>
        {loadError && <div className="alert error-alert load-alert"><CircleAlert size={17}/><div><strong>Couldn't load your applications</strong><p>{loadError}</p><button className="text-button" onClick={load}>Try again</button></div></div>}
        <section className="stats-grid">
          <div className="stat-card stat-total"><div className="stat-top"><span>Total applications</span><span className="stat-icon lavender"><BriefcaseBusiness size={17}/></span></div><div className="stat-number">{total}<span className="stat-caption">all time</span></div><div className="stat-foot"><span className="stat-trend"><TrendingUp size={13}/></span> Your journey, in one place</div><div className="stat-decoration decoration-one"/></div>
          <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon blue"><Clock3 size={17}/></span></div><div className="stat-number">{activeCount}</div><div className="stat-foot"><span className="foot-dot blue-dot"/> Applied, interview & offer</div><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/></div></div>
          <div className="stat-card"><div className="stat-top"><span>Interviews</span><span className="stat-icon orange"><CalendarDays size={17}/></span></div><div className="stat-number">{counts.Interview || 0}</div><div className="stat-foot"><span className="foot-dot orange-dot"/> Opportunities to connect</div><div className="stat-decoration decoration-two"/></div>
          <div className={`stat-card ${overdueCount ? 'stat-overdue' : ''}`}><div className="stat-top"><span>Follow-ups due</span><span className={`stat-icon ${overdueCount ? 'red' : 'green'}`}><Clock3 size={17}/></span></div><div className="stat-number">{overdueCount}</div><div className="stat-foot">{overdueCount ? <><span className="foot-dot red-dot"/> A gentle nudge is overdue</> : <><span className="foot-dot green-dot"/> You're all caught up</>}</div></div>
        </section>
        <section className="pipeline-section"><div className="section-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h2>Your application pipeline</h2><p>See where each opportunity stands.</p></div><div className="pipeline-total"><span className="pipeline-total-number">{total}</span><span>total tracked</span></div></div>
          <div className="pipeline-track">{STATUSES.map((s, i) => <button key={s} onClick={() => setStatus(status === s ? 'All statuses' : s)} className={`pipeline-step ${status === s ? 'pipeline-active' : ''}`}><div className={`pipeline-bar bar-${s.toLowerCase()}`}><span style={{width: total ? `${Math.max(8, (counts[s] || 0) / total * 100)}%` : '0%'}}/></div><div className="pipeline-meta"><span>{s}</span><strong>{counts[s] || 0}</strong></div></button>)}</div>
        </section>
        <section className="applications-section"><div className="section-heading applications-heading"><div><span className="eyebrow">YOUR OPPORTUNITIES</span><h2>Applications <span className="count-pill">{total}</span></h2><p>Every step counts. Keep your momentum going.</p></div><button className="button button-secondary" onClick={openAdd}><Plus size={16}/> New entry</button></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input aria-label="Search company" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company name…"/><kbd>⌕</kbd></div><div className="filter-wrap"><SlidersHorizontal size={15}/><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option>All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14}/></div><span className="results-label">{recentLabel}</span></div>
          <div className="application-list">{applications.map(app => <article key={app._id} className="application-card" onClick={() => setSelected(app)} tabIndex="0" onKeyDown={e => e.key === 'Enter' && setSelected(app)}><div className={`company-logo logo-${(app.companyName || 'x').charCodeAt(0) % 6}`}><Building2 size={20}/></div><div className="application-main"><div className="application-title-row"><h3>{app.companyName}</h3><span className="application-id">{app.applicationId}</span></div><p>{app.jobRole}</p><div className="application-meta"><span><BriefcaseBusiness size={13}/>{app.jobType}</span><span><CalendarDays size={13}/>{dateFmt(app.appliedDate)}</span></div></div><div className="application-status"><StatusBadge status={app.status}/>{app.isOverdue && <span className="overdue-badge"><span/>Follow-up Overdue</span>}</div><div className="application-end"><span className="salary-label">EXPECTED SALARY</span><strong>{moneyFmt(app.expectedSalary)}</strong><button className="open-card" aria-label={`View ${app.companyName} application`} onClick={e => {e.stopPropagation(); setSelected(app);}}><ArrowUpRight size={17}/></button></div></article>)}
            {!applications.length && <div className="empty-state"><div className="empty-icon"><Search size={23}/></div><h3>{search || status !== 'All statuses' ? 'No matching applications' : 'Your next opportunity starts here'}</h3><p>{search || status !== 'All statuses' ? 'Try a different company name or status filter.' : 'Add your first application and keep every step organized in one place.'}</p>{search || status !== 'All statuses' ? <button className="button button-secondary" onClick={() => {setSearch('');setStatus('All statuses');}}>Clear filters</button> : <button className="button button-primary" onClick={openAdd}><Plus size={16}/> Add your first application</button>}</div>}
          </div>
          <div className="list-footer"><span><span className="footer-sparkle">✳</span> Progress over perfection. Always.</span><button onClick={load} className="refresh-button"><RefreshCw size={13}/> Refresh list</button></div>
        </section>
        <footer className="page-footer"><span>Made for the journey, not just the destination.</span><span>PATHWAY <b>✳</b> CAREER TRACKER</span></footer>
      </div>
    </main>
    {formOpen && <ApplicationForm initial={editing} onClose={closeForm} onSubmit={submit} busy={busy} error={error}/>}
    {selected && <DetailsModal application={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={deleteApplication} onStatus={changeStatus} busy={busy}/>}
    {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
  </div>;
}
