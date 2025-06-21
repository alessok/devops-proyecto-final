import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../types';

interface UserFormProps {
  user?: User | null;
  currentUserRole: UserRole;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  currentUserRole,
  onSubmit, 
  onCancel 
}) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: user ? {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    } : {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: UserRole.EMPLOYEE,
      isActive: true
    }
  });

  const password = watch('password');

  const onSubmitForm = (data: any) => {
    const formData = { ...data };
    
    // Remove confirmPassword from the data
    delete formData.confirmPassword;
    
    // Remove empty password for updates
    if (user && !formData.password) {
      delete formData.password;
    }
    
    onSubmit(formData);
  };

  const getAvailableRoles = (): UserRole[] => {
    if (currentUserRole === UserRole.ADMIN) {
      return [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE];
    } else if (currentUserRole === UserRole.MANAGER) {
      return [UserRole.EMPLOYEE];
    }
    return [UserRole.EMPLOYEE];
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.MANAGER]: 'Gerente',
      [UserRole.EMPLOYEE]: 'Empleado'
    };
    return labels[role];
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      {/* Personal Information */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>
          Información Personal
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              className={`form-control ${errors.firstName ? 'error' : ''}`}
              placeholder="Nombre"
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
            <label className="form-label">Apellido *</label>
            <input
              type="text"
              className={`form-control ${errors.lastName ? 'error' : ''}`}
              placeholder="Apellido"
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
      </div>

      {/* Account Information */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>
          Información de Cuenta
        </h4>
        
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            type="email"
            className={`form-control ${errors.email ? 'error' : ''}`}
            placeholder="usuario@empresa.com"
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
          <label className="form-label">Username *</label>
          <input
            type="text"
            className={`form-control ${errors.username ? 'error' : ''}`}
            placeholder="usuario123"
            {...register('username', {
              required: 'El username es requerido',
              minLength: {
                value: 3,
                message: 'El username debe tener al menos 3 caracteres'
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

        {/* Password fields (only for new users or when updating) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
            </label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder={user ? 'Dejar vacío para mantener actual' : 'Contraseña'}
              {...register('password', user ? {} : {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Debe tener al menos una mayúscula, una minúscula y un número'
                }
              })}
            />
            {errors.password && (
              <div className="error-message">{errors.password.message}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              {user ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
            </label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirmar contraseña"
              {...register('confirmPassword', {
                validate: (value) => {
                  if (!user && !value) {
                    return 'Debes confirmar la contraseña';
                  }
                  if (password && value !== password) {
                    return 'Las contraseñas no coinciden';
                  }
                  return true;
                }
              })}
            />
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword.message}</div>
            )}
          </div>
        </div>
      </div>

      {/* Role and Status */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>
          Permisos y Estado
        </h4>
        
        <div className="form-group">
          <label className="form-label">Rol *</label>
          <select
            className={`form-control ${errors.role ? 'error' : ''}`}
            {...register('role', {
              required: 'El rol es requerido'
            })}
          >
            {getAvailableRoles().map(role => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>
          {errors.role && (
            <div className="error-message">{errors.role.message}</div>
          )}
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
            {currentUserRole === UserRole.MANAGER 
              ? 'Como gerente, solo puedes crear empleados'
              : 'Selecciona el nivel de acceso del usuario'
            }
          </div>
        </div>

        {user && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                {...register('isActive')}
              />
              <span className="form-label" style={{ margin: 0 }}>
                Usuario activo
              </span>
            </label>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Los usuarios inactivos no podrán iniciar sesión
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'flex-end',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e9ecef'
      }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          <X size={16} />
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          <Save size={16} />
          {user ? 'Actualizar' : 'Crear'} Usuario
        </button>
      </div>
    </form>
  );
};

export default UserForm;
