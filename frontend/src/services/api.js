import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 60_000,
});

export async function uploadDicom(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/api/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getStudies() {
  const { data } = await api.get('/api/studies');
  return data;
}

export async function getStudy(id) {
  const { data } = await api.get(`/api/studies/${id}`);
  return data;
}

export async function getHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export default api;
