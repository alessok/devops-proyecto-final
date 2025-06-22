import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';
import apiService from '../services/apiService';
import Modal from '../components/Modal';
import CategoryForm from '../components/CategoryForm';

const Categories: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
    
    // Check if we're on the "new" route and open modal
    if (location.pathname === '/categories/new') {
      setIsModalOpen(true);
    }
  }, [location.pathname]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar categorías');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (data: CreateCategoryRequest) => {
    try {
      const response = await apiService.createCategory(data);
      if (response.success && response.data) {
        setCategories([...categories, response.data]);
        setIsModalOpen(false);
        navigate('/categories');
        toast.success('Categoría creada exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al crear categoría';
      toast.error(errorMessage);
    }
  };

  const handleUpdateCategory = async (id: number, data: UpdateCategoryRequest) => {
    try {
      const response = await apiService.updateCategory(id, data);
      if (response.success && response.data) {
        setCategories(categories.map(c => c.id === id ? response.data! : c));
        setIsModalOpen(false);
        setEditingCategory(null);
        navigate('/categories');
        toast.success('Categoría actualizada exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar categoría';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      const response = await apiService.deleteCategory(id);
      if (response.success) {
        setCategories(categories.filter(c => c.id !== id));
        toast.success('Categoría eliminada exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar categoría';
      toast.error(errorMessage);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    navigate('/categories/new');
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    navigate('/categories');
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#495057' }}>Categorías</h1>
            <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
              Organiza tus productos en categorías ({filteredCategories.length} total)
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Nueva Categoría
          </button>
        </div>

        {/* Search */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6c757d'
                }} 
              />
              <input
                type="text"
                placeholder="Buscar categorías..."
                className="form-control"
                style={{ paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={64} style={{ marginBottom: '16px', color: '#6c757d' }} />
            <h3>No hay categorías</h3>
            <p>
              {searchTerm 
                ? 'No se encontraron categorías con el término de búsqueda'
                : 'Comienza creando tu primera categoría para organizar tus productos'
              }
            </p>
            {!searchTerm && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                Crear Primera Categoría
              </button>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            {filteredCategories.map((category) => (
              <div key={category.id} className="card">
                <div className="card-header">
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#495057',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FolderOpen size={20} style={{ color: '#007bff' }} />
                        {category.name}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: category.isActive ? '#d4edda' : '#f8d7da',
                        color: category.isActive ? '#155724' : '#721c24'
                      }}>
                        {category.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => openEditModal(category)}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  <p style={{ 
                    margin: 0, 
                    color: '#6c757d',
                    lineHeight: '1.5'
                  }}>
                    {category.description}
                  </p>
                  
                  <div style={{ 
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e9ecef',
                    fontSize: '14px',
                    color: '#6c757d'
                  }}>
                    <div>
                      <strong>Creada:</strong> {new Date(category.createdAt).toLocaleDateString('es-ES')}
                    </div>
                    {category.updatedAt !== category.createdAt && (
                      <div style={{ marginTop: '4px' }}>
                        <strong>Actualizada:</strong> {new Date(category.updatedAt).toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        >
          <CategoryForm
            category={editingCategory}
            onSubmit={async (data: CreateCategoryRequest | UpdateCategoryRequest) => {
              if (editingCategory) {
                await handleUpdateCategory(editingCategory.id, data);
              } else {
                await handleCreateCategory(data as CreateCategoryRequest);
              }
            }}
            onCancel={closeModal}
          />
        </Modal>
      </div>
    </div>
  );
};

export default Categories;
