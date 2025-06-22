import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { Product, Category, CreateProductRequest, UpdateProductRequest } from '../types';

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  categories, 
  onSubmit, 
  onCancel 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      isActive: product.isActive
    } : {
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      categoryId: ''
    }
  });

  const onSubmitForm = (data: any) => {
    // Convert strings to numbers for numeric fields
    const formattedData = {
      ...data,
      price: parseFloat(data.price),
      stockQuantity: parseInt(data.stockQuantity, 10),
      categoryId: parseInt(data.categoryId, 10)
    };
    
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <div className="form-group">
        <label className="form-label">Nombre del Producto *</label>
        <input
          type="text"
          className={`form-control ${errors.name ? 'error' : ''}`}
          placeholder="Nombre del producto"
          {...register('name', {
            required: 'El nombre del producto es requerido',
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
        <label className="form-label">Descripción</label>
        <textarea
          className={`form-control ${errors.description ? 'error' : ''}`}
          placeholder="Descripción del producto"
          rows={3}
          {...register('description', {
            required: 'La descripción es requerida'
          })}
        />
        {errors.description && (
          <div className="error-message">{errors.description.message}</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Precio *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={`form-control ${errors.price ? 'error' : ''}`}
            placeholder="0.00"
            {...register('price', {
              required: 'El precio es requerido',
              min: {
                value: 0,
                message: 'El precio debe ser mayor a 0'
              }
            })}
          />
          {errors.price && (
            <div className="error-message">{errors.price.message}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Cantidad en Stock *</label>
          <input
            type="number"
            min="0"
            className={`form-control ${errors.stockQuantity ? 'error' : ''}`}
            placeholder="0"
            {...register('stockQuantity', {
              required: 'La cantidad en stock es requerida',
              min: {
                value: 0,
                message: 'La cantidad debe ser mayor o igual a 0'
              }
            })}
          />
          {errors.stockQuantity && (
            <div className="error-message">{errors.stockQuantity.message}</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Categoría *</label>
        <select
          className={`form-control ${errors.categoryId ? 'error' : ''}`}
          {...register('categoryId', {
            required: 'La categoría es requerida'
          })}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <div className="error-message">{errors.categoryId.message}</div>
        )}
      </div>

      {product && (
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              {...register('isActive')}
            />
            <span className="form-label" style={{ margin: 0 }}>
              Producto activo
            </span>
          </label>
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
          {product ? 'Actualizar' : 'Crear'} Producto
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
