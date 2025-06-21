import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

// Components
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {user && <Navigation />}
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <Register />} 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } 
        />
        
        {/* 404 - Page not found */}
        <Route 
          path="*" 
          element={
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '4rem', margin: '0 0 16px 0', color: '#6c757d' }}>404</h1>
              <h2 style={{ margin: '0 0 16px 0', color: '#495057' }}>Página no encontrada</h2>
              <p style={{ margin: '0 0 24px 0', color: '#6c757d' }}>
                La página que buscas no existe o ha sido movida.
              </p>
              <button 
                onClick={() => window.history.back()} 
                className="btn btn-primary"
                style={{ marginRight: '12px' }}
              >
                Volver Atrás
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="btn btn-outline"
              >
                Ir al Dashboard
              </button>
            </div>
          } 
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
