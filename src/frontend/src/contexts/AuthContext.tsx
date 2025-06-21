import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { User, AuthContextType, RegisterRequest } from '../types';
import apiService from '../services/apiService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        const { token: newToken, refreshToken, user: userData } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(newToken);
        setUser(userData);
        
        toast.success('¡Inicio de sesión exitoso!');
      } else {
        throw new Error(response.message || 'Error en el inicio de sesión');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error en el inicio de sesión';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        const { token: newToken, refreshToken, user: newUser } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Update state
        setToken(newToken);
        setUser(newUser);
        
        toast.success('¡Registro exitoso!');
      } else {
        throw new Error(response.message || 'Error en el registro');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error en el registro';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to invalidate refresh token
      await apiService.logout();
    } catch (error) {
      // Even if logout fails on server, we still clear local data
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      toast.success('Sesión cerrada exitosamente');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.refreshToken(storedRefreshToken);
      
      if (response.success && response.data) {
        const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data;
        
        // Update localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(newToken);
        setUser(userData);
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshToken,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
