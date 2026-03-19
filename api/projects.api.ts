import api from './axios';

export interface ProjectDto {
  id: number;
  user_id: number;
  project_name: string;
  project_description: string | null;
  customer_name: string | null;
  customer_country: string | null;
  product_count: number;
  created_at: string;
}

export interface ProjectPayload {
  project_name: string;
  project_description?: string;
  customer_name?: string;
  customer_country?: string;
}

const wrap = <T>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const ProjectsApi = {
  list: () => wrap<ProjectDto[]>(api.get('/projects')),
  getById: (id: number) => wrap<ProjectDto>(api.get(`/projects/${id}`)),
  create: (payload: ProjectPayload) => wrap<ProjectDto>(api.post('/projects', payload)),
  update: (id: number, payload: Partial<ProjectPayload>) =>
    wrap<ProjectDto>(api.put(`/projects/${id}`, payload)),
  delete: (id: number) => api.delete(`/projects/${id}`),
};
