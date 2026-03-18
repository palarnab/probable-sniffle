import api from './api';

export async function uploadVolume(files, onProgress) {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file);
  }
  const { data } = await api.post('/api/volumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300_000,
    onUploadProgress: onProgress,
  });
  return data;
}

export async function getVolumes() {
  const { data } = await api.get('/api/volumes');
  return data;
}

export async function getVolume(id) {
  const { data } = await api.get(`/api/volumes/${id}`);
  return data;
}

export function buildWadoUri(volumeIdOrPath, fileIndex) {
  const base = api.defaults.baseURL || '';
  return `wadouri:${base}/api/volumes/${volumeIdOrPath}/files/${fileIndex}`;
}
