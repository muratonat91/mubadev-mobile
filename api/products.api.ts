import api from './axios';

export interface ProductImageDto {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface ProductDto {
  id: number;
  project_id: number;
  project_name: string;
  product_name: string;
  product_type: string;
  machine_type_name: string;
  machine_name: string;
  capacity: number;
  no_of_flavor: number;
  copied_from_project_name: string | null;
  created_at: string;
  images?: ProductImageDto[];
  // All detailed fields for full detail view
  to_be_commissioned?: boolean;
  total_volume?: number | null;
  inclusion_in_ice_cream?: boolean;
  ripple_sauce?: boolean;
  no_of_ripple_sauce?: number;
  filling_pattern?: string | null;
  liquid_sauce_topping?: boolean;
  liquid_sauce_topping_type?: string | null;
  dry_topping?: boolean;
  dry_topping_type_size?: string | null;
  chocolate_coating?: boolean;
  chocolate_coating_type?: string | null;
  coating_sequence?: string | null;
  dry_stuff_in_chocolate?: boolean;
  dry_stuff_type?: string | null;
  product_length_l1?: number | null;
  product_length_l2?: number | null;
  product_width_w?: number | null;
  product_thickness_h?: number | null;
  product_diameter?: number | null;
  cone_degree?: string | null;
  stick_type?: string | null;
  stick_length?: number | null;
  stick_width?: number | null;
  is_eol_inc?: boolean;
  how_many_pack_pattern?: number;
}

export interface ProductFilters {
  project_id?: number;
  machine_type_id?: number;
  product_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductPayload {
  project_id: number;
  machine_type_id: number;
  machine_id: number;
  product_type: string;
  product_name: string;
  capacity: number;
  to_be_commissioned: boolean;
  no_of_flavor: number;
  total_volume?: number | null;
  inclusion_in_ice_cream: boolean;
  ripple_sauce: boolean;
  no_of_ripple_sauce: number;
  liquid_sauce_topping: boolean;
  dry_topping: boolean;
  chocolate_coating: boolean;
  dry_stuff_in_chocolate: boolean;
  is_eol_inc: boolean;
  how_many_pack_pattern: number;
  [key: string]: unknown;
}

const wrap = <T>(p: Promise<{ data: { data: T; meta?: unknown } }>) => p.then(r => r.data);

export const ProductsApi = {
  list: (filters: ProductFilters) =>
    api.get('/products', { params: filters }).then(r => r.data as { data: ProductDto[]; meta: { total: number; page: number; limit: number } }),
  getById: (id: number) =>
    api.get(`/products/${id}`).then(r => r.data.data as ProductDto),
  create: (payload: ProductPayload) =>
    api.post('/products', payload).then(r => r.data.data as ProductDto),
  update: (id: number, payload: Partial<ProductPayload>) =>
    api.put(`/products/${id}`, payload).then(r => r.data.data as ProductDto),
  delete: (id: number) => api.delete(`/products/${id}`),
  copy: (id: number, targetProjectId: number) =>
    api.post(`/products/${id}/copy`, { target_project_id: targetProjectId }).then(r => r.data.data as ProductDto),
  uploadImage: (productId: number, uri: string, isPrimary: boolean) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('image', { uri, name: filename, type } as unknown as Blob);
    formData.append('is_primary', isPrimary ? '1' : '0');
    return api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data as ProductImageDto);
  },
  deleteImage: (productId: number, imageId: number) =>
    api.delete(`/products/${productId}/images/${imageId}`),
};
