const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export async function api(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({ success: false, message: 'The server returned an invalid response.', data: null }));
  if (!response.ok || !result.success) {
    const error = new Error(result.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return result;
}
