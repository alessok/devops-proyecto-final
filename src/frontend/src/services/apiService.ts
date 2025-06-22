import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DashboardStats
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api/v1';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos timeout
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('token', response.data.token);
              localStorage.setItem('refreshToken', response.data.refreshToken);
              
              // Retry the original request
              error.config.headers.Authorization = `Bearer ${response.data.token}`;
              return this.api.request(error.config);
            } catch (refreshError) {
              // Refresh failed, logout user
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          } else {
            // No refresh token, redirect to login
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
    return response.data;
  }

  // User Methods
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.api.get('/users');
    return response.data;
  }

  async getUserById(id: number): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/users', data);
    return response.data;
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // Product Methods
  async getProducts(): Promise<ApiResponse<Product[]>> {
    const response: AxiosResponse<ApiResponse<Product[]>> = await this.api.get('/products');
    return response.data;
  }

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    const response: AxiosResponse<ApiResponse<Product>> = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    const response: AxiosResponse<ApiResponse<Product>> = await this.api.post('/products', data);
    return response.data;
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    const response: AxiosResponse<ApiResponse<Product>> = await this.api.put(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/products/${id}`);
    return response.data;
  }

  // Category Methods
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response: AxiosResponse<ApiResponse<Category[]>> = await this.api.get('/categories');
    return response.data;
  }

  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    const response: AxiosResponse<ApiResponse<Category>> = await this.api.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    const response: AxiosResponse<ApiResponse<Category>> = await this.api.post('/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    const response: AxiosResponse<ApiResponse<Category>> = await this.api.put(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/categories/${id}`);
    return response.data;
  }

  // Dashboard Methods (public endpoints)
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    // Create a separate axios instance for public endpoints without auth interceptor
    const publicApi = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await publicApi.get('/dashboard/stats');
    return response.data;
  }

  // Search Methods
  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    const response: AxiosResponse<ApiResponse<Product[]>> = await this.api.get(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Low Stock Products
  async getLowStockProducts(): Promise<ApiResponse<Product[]>> {
    const response: AxiosResponse<ApiResponse<Product[]>> = await this.api.get('/products/low-stock');
    return response.data;
  }

  // Public endpoints (no authentication required)
  async getPublicProducts(): Promise<ApiResponse<Product[]>> {
    // Create a separate axios instance for public endpoints without auth interceptor
    const publicApi = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    const response: AxiosResponse<ApiResponse<Product[]>> = await publicApi.get('/public/products');
    return response.data;
  }

  async getPublicCategories(): Promise<ApiResponse<Category[]>> {
    // Create a separate axios instance for public endpoints without auth interceptor
    const publicApi = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    const response: AxiosResponse<ApiResponse<Category[]>> = await publicApi.get('/public/categories');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
