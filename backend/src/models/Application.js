import mongoose from 'mongoose';
import { JOB_TYPES, STATUSES } from '../utils/constants.js';

const historySchema = new mongoose.Schema({
  status: { type: String, enum: STATUSES, required: true },
  date: { type: Date, default: Date.now, required: true }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true, immutable: true },
  companyName: { type: String, required: true, trim: true },
  companyKey: { type: String, required: true, index: true },
  jobRole: { type: String, required: true, trim: true },
  jobRoleKey: { type: String, required: true, lowercase: true, trim: true },
  jobType: { type: String, enum: JOB_TYPES, required: true },
  appliedDate: { type: Date, required: true, immutable: true },
  expectedSalary: { type: Number, min: 0, default: null },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: STATUSES, default: 'Applied', required: true },
  statusHistory: { type: [historySchema], default: [] },
  followUpDate: { type: Date, required: true, immutable: true }
}, { timestamps: true, versionKey: false });

applicationSchema.index({ companyKey: 1, jobRoleKey: 1, status: 1 });
applicationSchema.methods.toClient = function () {
  const item = this.toObject();
  item.isOverdue = item.status === 'Applied' && new Date() > new Date(item.followUpDate);
  return item;
};
export default mongoose.model('Application', applicationSchema);
