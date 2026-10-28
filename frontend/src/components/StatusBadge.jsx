export default function StatusBadge({ status }) {
  const classes = { Applied: 'status-applied', Interview: 'status-interview', Offer: 'status-offer', Rejected: 'status-rejected', Accepted: 'status-accepted', Declined: 'status-declined' };
  return <span className={`status-badge ${classes[status] || ''}`}><span className="status-dot"/>{status}</span>;
}
