import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const empty = { companyName: '', jobRole: '', jobType: 'Full-time', appliedDate: today, expectedSalary: '', notes: '' };

export default function ApplicationForm({ initial, onClose, onSubmit, busy, error }) {
  const [form, setForm] = useState(empty);
  const [validation, setValidation] = useState('');
  useEffect(() => {
    if (initial) setForm({ companyName: initial.companyName, jobRole: initial.jobRole, jobType: initial.jobType, appliedDate: initial.appliedDate?.slice(0, 10), expectedSalary: initial.expectedSalary ?? '', notes: initial.notes || '' });
    else setForm(empty);
  }, [initial]);
  const edit = Boolean(initial);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setValidation('');
    if (!form.companyName.trim() || !form.jobRole.trim()) return setValidation('Company name and job role are required.');
    if (!edit && form.appliedDate > today) return setValidation('Applied date cannot be in the future.');
    if (form.expectedSalary !== '' && Number(form.expectedSalary) < 0) return setValidation('Expected salary cannot be negative.');
    const payload = { companyName: form.companyName.trim(), jobRole: form.jobRole.trim(), jobType: form.jobType, expectedSalary: form.expectedSalary, notes: form.notes };
    if (!edit) payload.appliedDate = form.appliedDate;
    await onSubmit(payload);
  };
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="modal-heading"><div><span className="eyebrow">APPLICATION DETAILS</span><h2 id="form-title">{edit ? 'Edit application' : 'Add a new application'}</h2><p>{edit ? 'Keep your application information up to date.' : 'Capture the details while they’re fresh.'}</p></div><button className="icon-button" onClick={onClose} aria-label="Close form"><X size={19}/></button></div>
      {(validation || error) && <div className="alert error-alert">{validation || error}</div>}
      <form onSubmit={submit} className="application-form">
        <label>Company name <span>*</span><input name="companyName" value={form.companyName} onChange={update} placeholder="e.g. Google" maxLength="120" required /></label>
        <label>Job role <span>*</span><input name="jobRole" value={form.jobRole} onChange={update} placeholder="e.g. Frontend Developer" maxLength="120" required /></label>
        <div className="form-row"><label>Job type<select name="jobType" value={form.jobType} onChange={update}><option>Full-time</option><option>Internship</option><option>Contract</option></select></label>
        <label>Applied date <span>*</span><input type="date" name="appliedDate" value={form.appliedDate} onChange={update} max={today} disabled={edit} required />{edit && <small>This date cannot be changed.</small>}</label></div>
        <label>Expected salary <small>Optional · annual amount</small><div className="salary-input"><span>₹</span><input type="number" min="0" step="any" name="expectedSalary" value={form.expectedSalary} onChange={update} placeholder="e.g. 800000" /></div></label>
        <label>Notes <small>Optional</small><textarea name="notes" value={form.notes} onChange={update} rows="3" maxLength="2000" placeholder="Recruiter contact, interview prep, job link…" /></label>
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}><Save size={16}/>{busy ? 'Saving…' : edit ? 'Save changes' : 'Add application'}</button></div>
      </form>
    </section>
  </div>;
}
