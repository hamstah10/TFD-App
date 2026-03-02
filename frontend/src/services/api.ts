import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chiptuning API
export const getVehicleTypes = async () => {
  const response = await api.get('/chiptuning/types');
  return response.data;
};

export const getManufacturers = async (typeId: string) => {
  const response = await api.get(`/chiptuning/manufacturers/${typeId}`);
  return response.data;
};

export const getModels = async (manufacturerId: string) => {
  const response = await api.get(`/chiptuning/models/${manufacturerId}`);
  return response.data;
};

export const getBuilts = async (modelId: string) => {
  const response = await api.get(`/chiptuning/builts/${modelId}`);
  return response.data;
};

export const getEngines = async (builtId: string) => {
  const response = await api.get(`/chiptuning/engines/${builtId}`);
  return response.data;
};

export const getStages = async (engineId: string) => {
  const response = await api.get(`/chiptuning/stages/${engineId}`);
  return response.data;
};

// Blog API
export const getBlogPosts = async (publishedOnly: boolean = true) => {
  const response = await api.get('/blog', { params: { published_only: publishedOnly } });
  return response.data;
};

export const getBlogPost = async (postId: string) => {
  const response = await api.get(`/blog/${postId}`);
  return response.data;
};

export const createBlogPost = async (post: any) => {
  const response = await api.post('/blog', post);
  return response.data;
};

export const updateBlogPost = async (postId: string, post: any) => {
  const response = await api.put(`/blog/${postId}`, post);
  return response.data;
};

export const deleteBlogPost = async (postId: string) => {
  const response = await api.delete(`/blog/${postId}`);
  return response.data;
};

// Contact API
export const submitContactMessage = async (message: any) => {
  const response = await api.post('/contact', message);
  return response.data;
};

export const getContactMessages = async () => {
  const response = await api.get('/contact');
  return response.data;
};

export const markMessageRead = async (messageId: string) => {
  const response = await api.put(`/contact/${messageId}/read`);
  return response.data;
};

export const deleteContactMessage = async (messageId: string) => {
  const response = await api.delete(`/contact/${messageId}`);
  return response.data;
};

// Opening Hours API
export const getOpeningHours = async () => {
  const response = await api.get('/opening-hours');
  return response.data;
};

export const updateOpeningHours = async (hours: any) => {
  const response = await api.put('/opening-hours', hours);
  return response.data;
};

// Company Info
export const getCompanyInfo = async () => {
  const response = await api.get('/company-info');
  return response.data;
};

// Customer Photos API
export const savePhoto = async (userId: string, base64: string, filename?: string, description?: string) => {
  const response = await api.post('/photos', {
    user_id: userId,
    base64,
    filename,
    description,
  });
  return response.data;
};

export const getUserPhotos = async (userId: string) => {
  const response = await api.get(`/photos/${userId}`);
  return response.data;
};

export const deletePhoto = async (photoId: string) => {
  const response = await api.delete(`/photos/${photoId}`);
  return response.data;
};

export default api;
