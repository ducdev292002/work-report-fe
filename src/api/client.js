import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue = [];

// Requests whose own 401 already carries a specific, user-facing reason
// (bad credentials, wrong current password) must NOT be silently retried
// through the refresh flow — that would swallow the real error message and
// replace it with a generic "session expired" one.
const NO_REFRESH_RETRY_URLS = new Set(['/auth/login', '/auth/refresh', '/auth/change-password']);

function resolveQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || config._retry || NO_REFRESH_RETRY_URLS.has(config.url)) {
      return Promise.reject(error);
    }

    config._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => api(config));
    }

    isRefreshing = true;
    try {
      await api.post('/auth/refresh');
      resolveQueue(null);
      return api(config);
    } catch (refreshError) {
      resolveQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
