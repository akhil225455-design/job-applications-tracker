export const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Declined'];
export const FINAL_STATUSES = ['Rejected', 'Accepted', 'Declined'];
export const TRANSITIONS = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Rejected: [], Accepted: [], Declined: []
};
export const JOB_TYPES = ['Full-time', 'Internship', 'Contract'];
