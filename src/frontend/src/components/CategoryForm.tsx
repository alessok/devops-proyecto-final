import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ 
  category, 
  onSubmit, 
  onCancel 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: category ? {
      name: category.name,
      description: category.description,
      isActive: category.isActive
    } : {
      name: '',
      description: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label className="form-label">Nombre de la Categoría *</label>
        <input
          type="text"
          className={`form-control ${errors.name ? 'error' : ''}`}
          placeholder="Nombre de la categoría"
          {...register('name', {
            required: 'El nombre de la categoría es requerido',
            minLength: {
              value: 2,
              message: 'El nombre debe tener al menos 2 caracteres'
            }
          })}
        />
        {errors.name && (
          <div className="error-message">{errors.name.message}</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Descripción *</label>
        <textarea
          className={`form-control ${errors.description ? 'error' : ''}`}
          placeholder="Descripción de la categoría"
          rows={4}
          {...register('description', {
            required: 'La descripción es requerida',
            minLength: {
              value: 10,
              message: 'La descripción debe tener al menos 10 caracteres'
            }
          })}
        />
        {errors.description && (
          <div className="error-message">{errors.description.message}</div>
        )}
      </div>

      {category && (
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              {...register('isActive')}
            />
            <span className="form-label" style={{ margin: 0 }}>
              Categoría activa
            </span>
          </label>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
            Las categorías inactivas no aparecerán en los formularios de productos
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'flex-end',
        marginTop: '24px' 
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
          {category ? 'Actualizar' : 'Crear'} Categoría
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
