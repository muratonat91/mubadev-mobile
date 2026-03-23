import api from './axios';

export const ExportApi = {
  downloadPdf: (projectId: number) =>
    api.get(`/export/pdf/${projectId}`, { responseType: 'arraybuffer' }),
  downloadExcel: (projectId: number) =>
    api.get(`/export/excel/${projectId}`, { responseType: 'arraybuffer' }),
};
