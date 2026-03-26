import api from './axios';

export const ExportApi = {
  downloadPdf: (projectId: number) =>
    api.get(`/export/projects/${projectId}/pdf`, { responseType: 'arraybuffer' }),
  downloadExcel: (projectId: number) =>
    api.get(`/export/projects/${projectId}/excel`, { responseType: 'arraybuffer' }),
};
