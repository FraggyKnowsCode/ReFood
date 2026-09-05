import axios from 'axios';
import { supabase } from './supabaseClient';

// ── In-memory SWR-style cache ─────────────────────────────────────────────
// Stores { data, timestamp } per URL key.
// GET requests return cached data immediately (stale) and revalidate in bg.
const CACHE_TTL = 30_000; // 30 seconds
const cache = new Map();

export const invalidateCache = (urlPattern) => {
  if (!urlPattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) cache.delete(key);
  }
};

// ── Axios instance ────────────────────────────────────────────────────────
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:5000/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Cache GET responses on the way back
api.interceptors.response.use((response) => {
  if (response.config.method === 'get') {
    const key = response.config.url + JSON.stringify(response.config.params || {});
    cache.set(key, { data: response.data, timestamp: Date.now() });
  }
  return response;
});

// ── Cached GET helper ─────────────────────────────────────────────────────
// Returns { data, loading, refresh }
// - Instantly returns cached data if fresh enough
// - Always revalidates in background and calls onUpdate when done
export const cachedGet = async (url, onUpdate, params = {}) => {
  const key = url + JSON.stringify(params);
  const hit = cache.get(key);

  // Return stale data immediately if available
  if (hit) onUpdate(hit.data, false);

  // Only skip network if cache is truly fresh (< TTL)
  const isFresh = hit && (Date.now() - hit.timestamp) < CACHE_TTL;
  if (isFresh) return;

  // Revalidate in background (or initially if no cache)
  try {
    const res = await api.get(url, { params });
    cache.set(key, { data: res.data, timestamp: Date.now() });
    onUpdate(res.data, false);
  } catch (err) {
    onUpdate(hit?.data ?? null, false, err);
  }
};

export default api;
