import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://chiptuning-app.preview.emergentagent.com';

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

export const getManufacturers = async (typeId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/manufacturers/${typeId}`, { params });
  return response.data;
};

export const getModels = async (manufacturerId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/models/${manufacturerId}`, { params });
  return response.data;
};

export const getBuilts = async (modelId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/builts/${modelId}`, { params });
  return response.data;
};

export const getEngines = async (builtId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/engines/${builtId}`, { params });
  return response.data;
};

export const getStages = async (engineId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/stages/${engineId}`, { params });
  return response.data;
};

export const getEcus = async (engineId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/ecus/${engineId}`, { params });
  return response.data;
};

export const getOptions = async (engineId: string, ecuId: string, mdtId?: string) => {
  const params = mdtId ? { mdt_id: mdtId } : {};
  const response = await api.get(`/chiptuning/options/${engineId}/${ecuId}`, { params });
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

// Fahrzeugschein Scanner API
export interface FahrzeugscheinData {
  type?: string;
  registrationNumber?: string;
  vin?: string;
  ez?: string;
  ez_string?: string;
  hsn?: string;
  tsn?: string;
  d1?: string;  // Marke
  d3?: string;  // Handelsbezeichnung
  name?: string;
  firstname?: string;
  address1?: string;
  address2?: string;
  p1?: string;  // Hubraum
  p3?: string;  // Kraftstoff
  field_14?: string;  // Emissionsklasse
  g?: string;  // Leergewicht
  f1?: string;  // Zulässige Gesamtmasse
  j?: string;  // Fahrzeugklasse
  [key: string]: any;
}

export interface FahrzeugscheinScanResult {
  success: boolean;
  country_code?: string;
  data?: FahrzeugscheinData;
  error?: string;
}

export const scanFahrzeugschein = async (base64Image: string): Promise<FahrzeugscheinScanResult> => {
  const response = await api.post('/scan-fahrzeugschein', {
    image: base64Image,
    show_cuts: false,
  });
  return response.data;
};

// ============== AUTH API ==============

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  customer: {
    id: number;
    companyName: string;
    email: string;
    username: string;
  };
}

export interface RefreshResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export const authLogin = async (email: string, password: string, deviceName: string = 'tuningfiles-app'): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', {
    email,
    password,
    deviceName,
  });
  return response.data;
};

export const authRefresh = async (refreshToken: string): Promise<RefreshResponse> => {
  const response = await api.post('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

export const authLogout = async (accessToken: string): Promise<void> => {
  await api.post('/auth/logout', {}, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const authGetMe = async (accessToken: string) => {
  const response = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

// ============== ORDER API (User-specific) ==============

export interface OrderCreateData {
  fileName: string;
  fileData: string;
  fileSize: number;
  tuningTool: string;
  method: string;
  slaveOrMaster: string;
  vehicleType?: string;
  manufacturer?: string;
  model?: string;
  built?: string;
  engine?: string;
  stage?: string;
  vehicleDisplay?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: number;
  createdAt: string;
  status: string;
  fileName: string;
  vehicle: string;
  stage: string;
  tuningTool: string;
  method: string;
  slaveOrMaster: string;
}

export const createOrder = async (accessToken: string, orderData: OrderCreateData): Promise<Order> => {
  const response = await api.post('/orders', orderData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getOrders = async (accessToken: string): Promise<Order[]> => {
  const response = await api.get('/orders', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getOrder = async (accessToken: string, orderId: string): Promise<Order> => {
  const response = await api.get(`/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

// ============== CUSTOMER PHOTOS API (User-specific) ==============

export interface CustomerPhoto {
  id: string;
  filename: string;
  description: string;
  createdAt: string;
  base64?: string;
}

export const saveCustomerPhoto = async (accessToken: string, base64: string, filename?: string, description?: string): Promise<CustomerPhoto> => {
  const response = await api.post('/customer/photos', {
    base64,
    filename,
    description,
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getCustomerPhotos = async (accessToken: string): Promise<CustomerPhoto[]> => {
  const response = await api.get('/customer/photos', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const deleteCustomerPhoto = async (accessToken: string, photoId: string): Promise<void> => {
  await api.delete(`/customer/photos/${photoId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

// ============== SCANS API (User-specific) ==============

export interface ScanData {
  id: string;
  createdAt: string;
  vehicleData: FahrzeugscheinData;
  selectedStage?: any;
}

export const saveScan = async (
  accessToken: string, 
  vehicleData: FahrzeugscheinData, 
  selectedStage?: any,
  imageBase64?: string
): Promise<ScanData> => {
  const response = await api.post('/customer/scans', {
    vehicleData,
    selectedStage,
    imageBase64,
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getScans = async (accessToken: string): Promise<ScanData[]> => {
  const response = await api.get('/customer/scans', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

// ============== TICKETS API (User-specific) ==============

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  lastReply: string;
  messageCount: number;
}

export interface TicketMessage {
  sender: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export const createTicket = async (
  accessToken: string, 
  subject: string, 
  message: string, 
  priority: string = 'normal'
): Promise<Ticket> => {
  const response = await api.post('/customer/tickets', {
    subject,
    message,
    priority,
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getTickets = async (accessToken: string): Promise<Ticket[]> => {
  const response = await api.get('/customer/tickets', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getTicketDetail = async (accessToken: string, ticketNumber: string): Promise<TicketDetail> => {
  const response = await api.get(`/customer/tickets/${ticketNumber}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const replyToTicket = async (accessToken: string, ticketNumber: string, message: string): Promise<void> => {
  await api.post(`/customer/tickets/${ticketNumber}/reply`, {
    message,
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export default api;
