export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, data: null });
}
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500);
  res.status(status).json({ success: false, message: err.message || 'Internal server error', data: null });
}
export const fail = (status, message) => Object.assign(new Error(message), { status });
