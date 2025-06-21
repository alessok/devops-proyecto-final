// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// User Types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee'
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  categoryId?: number;
  isActive?: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    user: User;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loading: boolean;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Form Types
export interface FormErrors {
  [key: string]: string;
}

// Filter and Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FilterParams {
  search?: string;
  category?: number;
  isActive?: boolean;
}

export interface ProductFilters extends FilterParams {
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalUsers: number;
  lowStockProducts: number;
  totalValue: number;
}

// Stock Alert Types
export interface StockAlert {
  productId: number;
  productName: string;
  currentStock: number;
  minimumStock: number;
  category: string;
}
