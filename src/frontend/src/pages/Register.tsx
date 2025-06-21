import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterRequest } from '../types';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();
  const password = watch('password');

  const onSubmit = async (data: RegisterRequest) => {
    try {
      setIsSubmitting(true);
      await registerUser(data);
      navigate('/dashboard', { replace: true });
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>
          <UserPlus size={32} style={{ color: '#007bff', marginBottom: '16px' }} />
          <h2 style={{ margin: 0, color: '#495057' }}>Crear Cuenta</h2>
          <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
            Regístrate en el sistema de inventario
          </p>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  <User size={16} style={{ marginRight: '8px' }} />
                  Nombre
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? 'error' : ''}`}
                  placeholder="Tu nombre"
                  {...register('firstName', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'El nombre debe tener al menos 2 caracteres'
                    }
                  })}
                />
                {errors.firstName && (
                  <div className="error-message">{errors.firstName.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={16} style={{ marginRight: '8px' }} />
                  Apellido
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? 'error' : ''}`}
                  placeholder="Tu apellido"
                  {...register('lastName', {
                    required: 'El apellido es requerido',
                    minLength: {
                      value: 2,
                      message: 'El apellido debe tener al menos 2 caracteres'
                    }
                  })}
                />
                {errors.lastName && (
                  <div className="error-message">{errors.lastName.message}</div>
                )}
              </div>
            </div>

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
                <User size={16} style={{ marginRight: '8px' }} />
                Nombre de Usuario
              </label>
              <input
                type="text"
                className={`form-control ${errors.username ? 'error' : ''}`}
                placeholder="usuario123"
                {...register('username', {
                  required: 'El nombre de usuario es requerido',
                  minLength: {
                    value: 3,
                    message: 'El nombre de usuario debe tener al menos 3 caracteres'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Solo se permiten letras, números y guiones bajos'
                  }
                })}
              />
              {errors.username && (
                <div className="error-message">{errors.username.message}</div>
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
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
                  }
                })}
              />
              {errors.password && (
                <div className="error-message">{errors.password.message}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} style={{ marginRight: '8px' }} />
                Confirmar Contraseña
              </label>
              <input
                type="password"
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirma tu contraseña"
                {...register('confirmPassword', {
                  required: 'Debes confirmar la contraseña',
                  validate: (value) => 
                    value === password || 'Las contraseñas no coinciden'
                })}
              />
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword.message}</div>
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
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Crear Cuenta
                </>
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                ¿Ya tienes cuenta?{' '}
                <Link 
                  to="/login" 
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
