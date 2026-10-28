import { Router } from 'express';
import Application from '../models/Application.js';
import Counter from '../models/Counter.js';
import { FINAL_STATUSES, JOB_TYPES, STATUSES, TRANSITIONS } from '../utils/constants.js';
import { fail } from '../middleware/errors.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const respond = (res, status, message, data) => res.status(status).json({ success: true, message, data });
const dateOnly = (date) => new Date(`${date}T00:00:00.000Z`);
const validateAppliedDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) throw fail(400, 'Applied Date is required and must be a valid date.');
  const selected = new Date(value);
  const today = new Date(); today.setHours(23, 59, 59, 999);
  if (selected > today) throw fail(400, 'Applied Date cannot be in the future.');
  return selected;
};
const companyPrefix = (name) => (name.match(/[a-z]/ig) || []).join('').slice(0, 3).toUpperCase().padEnd(3, 'X');
const makeId = async (companyKey) => {
  const counter = await Counter.findOneAndUpdate(
    { companyKey }, { $inc: { sequence: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `JA-${companyPrefix(companyKey)}-${String(counter.sequence).padStart(3, '0')}`;
};
const getApplication = async (id) => {
  const app = await Application.findById(id);
  if (!app) throw fail(404, 'Application not found.');
  return app;
};
const ensureDuplicateAllowed = async (companyKey, jobRoleKey, excludeId = null) => {
  const query = { companyKey, jobRoleKey, status: { $nin: FINAL_STATUSES } };
  if (excludeId) query._id = { $ne: excludeId };
  if (await Application.exists(query)) throw fail(409, 'An active application already exists for this company and job role.');
};

// GET /api/applications?status=Applied&search=google
router.get('/', wrap(async (req, res) => {
  const { status, search = '' } = req.query;
  if (status && !STATUSES.includes(status)) throw fail(400, `Invalid status filter. Use: ${STATUSES.join(', ')}.`);
  const filter = {};
  if (status) filter.status = status;
  if (search.trim()) filter.companyName = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const [items, grouped] = await Promise.all([
    Application.find(filter).sort({ appliedDate: -1, createdAt: -1 }),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);
  const counts = Object.fromEntries(STATUSES.map(s => [s, 0]));
  grouped.forEach(row => { counts[row._id] = row.count; });
  respond(res, 200, 'Applications retrieved successfully.', { applications: items.map(x => x.toClient()), counts, total: items.length });
}));

router.post('/', wrap(async (req, res) => {
  const { companyName, jobRole, jobType, appliedDate, expectedSalary, notes } = req.body;
  if (!companyName?.trim() || !jobRole?.trim()) throw fail(400, 'Company Name and Job Role are required.');
  if (!JOB_TYPES.includes(jobType)) throw fail(400, `Job Type must be one of: ${JOB_TYPES.join(', ')}.`);
  const parsedDate = validateAppliedDate(appliedDate);
  if (expectedSalary !== undefined && expectedSalary !== null && expectedSalary !== '' && (!Number.isFinite(Number(expectedSalary)) || Number(expectedSalary) < 0)) throw fail(400, 'Expected Salary must be a non-negative number.');
  const companyKey = companyName.trim().toLowerCase();
  const jobRoleKey = jobRole.trim().toLowerCase();
  await ensureDuplicateAllowed(companyKey, jobRoleKey);
  const applicationId = await makeId(companyKey);
  const application = await Application.create({
    applicationId, companyName: companyName.trim(), companyKey, jobRole: jobRole.trim(), jobRoleKey,
    jobType, appliedDate: parsedDate, expectedSalary: expectedSalary === '' || expectedSalary == null ? null : Number(expectedSalary),
    notes: notes?.trim() || '', status: 'Applied', followUpDate: new Date(parsedDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    statusHistory: [{ status: 'Applied', date: new Date() }]
  });
  respond(res, 201, 'Application created successfully.', application.toClient());
}));

router.get('/:id', wrap(async (req, res) => {
  const app = await getApplication(req.params.id);
  respond(res, 200, 'Application retrieved successfully.', app.toClient());
}));

router.put('/:id', wrap(async (req, res) => {
  const app = await getApplication(req.params.id);
  const { companyName, jobRole, jobType, expectedSalary, notes, applicationId, appliedDate, status, followUpDate } = req.body;
  if (applicationId !== undefined || appliedDate !== undefined || followUpDate !== undefined) throw fail(400, 'Application ID, Applied Date and Follow-up Date cannot be edited.');
  if (status !== undefined) throw fail(400, 'Use the status endpoint to change application status.');
  const nextCompany = companyName === undefined ? app.companyName : String(companyName).trim();
  const nextRole = jobRole === undefined ? app.jobRole : String(jobRole).trim();
  const nextType = jobType === undefined ? app.jobType : jobType;
  if (!nextCompany || !nextRole) throw fail(400, 'Company Name and Job Role are required.');
  if (!JOB_TYPES.includes(nextType)) throw fail(400, `Job Type must be one of: ${JOB_TYPES.join(', ')}.`);
  const companyKey = nextCompany.toLowerCase(), jobRoleKey = nextRole.toLowerCase();
  await ensureDuplicateAllowed(companyKey, jobRoleKey, app._id);
  if (expectedSalary !== undefined) {
    if (expectedSalary !== null && expectedSalary !== '' && (!Number.isFinite(Number(expectedSalary)) || Number(expectedSalary) < 0)) throw fail(400, 'Expected Salary must be a non-negative number.');
    app.expectedSalary = expectedSalary === '' || expectedSalary == null ? null : Number(expectedSalary);
  }
  app.companyName = nextCompany; app.companyKey = companyKey; app.jobRole = nextRole; app.jobRoleKey = jobRoleKey; app.jobType = nextType;
  if (notes !== undefined) app.notes = String(notes).trim();
  await app.save();
  respond(res, 200, 'Application updated successfully.', app.toClient());
}));

router.patch('/:id/status', wrap(async (req, res) => {
  const app = await getApplication(req.params.id);
  const { status: nextStatus } = req.body;
  if (!STATUSES.includes(nextStatus)) throw fail(400, `Invalid status. Use: ${STATUSES.join(', ')}.`);
  const allowed = TRANSITIONS[app.status];
  if (!allowed.includes(nextStatus)) {
    const message = allowed.length ? `Cannot change status from ${app.status} to ${nextStatus}. Allowed next statuses: ${allowed.join(' or ')}.` : `${app.status} is a final status and cannot be changed.`;
    throw fail(400, message);
  }
  app.status = nextStatus;
  app.statusHistory.push({ status: nextStatus, date: new Date() });
  await app.save();
  respond(res, 200, 'Application status updated successfully.', app.toClient());
}));

router.delete('/:id', wrap(async (req, res) => {
  const app = await getApplication(req.params.id);
  if (app.status === 'Interview' || app.status === 'Offer') throw fail(400, `Applications in ${app.status} status cannot be deleted.`);
  await app.deleteOne();
  respond(res, 200, 'Application deleted successfully.', { _id: app._id, applicationId: app.applicationId });
}));

export default router;
