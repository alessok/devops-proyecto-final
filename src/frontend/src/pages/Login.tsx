import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types';

const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>
          <LogIn size={32} style={{ color: '#007bff', marginBottom: '16px' }} />
          <h2 style={{ margin: 0, color: '#495057' }}>Iniciar Sesión</h2>
          <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
            Accede al sistema de inventario
          </p>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} style={{ marginRight: '8px' }} />
                Email
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
              />
              {errors.email && (
                <div className="error-message">{errors.email.message}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} style={{ marginRight: '8px' }} />
                Contraseña
              </label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Tu contraseña"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
              />
              {errors.password && (
                <div className="error-message">{errors.password.message}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '16px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Iniciar Sesión
                </>
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                ¿No tienes cuenta?{' '}
                <Link 
                  to="/register" 
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
