import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Product, Category, CreateProductRequest, UpdateProductRequest } from '../types';
import apiService from '../services/apiService';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);

      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }
    } catch (error) {
      toast.error('Error al cargar productos');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (data: CreateProductRequest) => {
    try {
      const response = await apiService.createProduct(data);
      if (response.success && response.data) {
        setProducts([...products, response.data]);
        setIsModalOpen(false);
        toast.success('Producto creado exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al crear producto';
      toast.error(errorMessage);
    }
  };

  const handleUpdateProduct = async (id: number, data: UpdateProductRequest) => {
    try {
      const response = await apiService.updateProduct(id, data);
      if (response.success && response.data) {
        setProducts(products.map(p => p.id === id ? response.data! : p));
        setIsModalOpen(false);
        setEditingProduct(null);
        toast.success('Producto actualizado exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar producto';
      toast.error(errorMessage);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const response = await apiService.deleteProduct(id);
      if (response.success) {
        setProducts(products.filter(p => p.id !== id));
        toast.success('Producto eliminado exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar producto';
      toast.error(errorMessage);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { text: 'Sin stock', color: '#dc3545', icon: AlertTriangle };
    } else if (quantity < 10) {
      return { text: 'Stock bajo', color: '#fd7e14', icon: AlertTriangle };
    } else {
      return { text: 'En stock', color: '#28a745', icon: Package };
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
            <h1 style={{ margin: 0, color: '#495057' }}>Productos</h1>
            <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
              Gestiona el inventario de productos ({filteredProducts.length} total)
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Nuevo Producto
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto', 
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative' }}>
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
                  placeholder="Buscar productos..."
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="form-control"
                style={{ minWidth: '200px' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === '' ? '' : parseInt(e.target.value))}
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={64} style={{ marginBottom: '16px', color: '#6c757d' }} />
            <h3>No hay productos</h3>
            <p>
              {searchTerm || selectedCategory 
                ? 'No se encontraron productos con los filtros aplicados'
                : 'Comienza agregando tu primer producto'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                Crear Primer Producto
              </button>
            )}
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Valor Total</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stockQuantity);
                    const StockIcon = stockStatus.icon;
                    
                    return (
                      <tr key={product.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: '500', color: '#495057' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6c757d' }}>
                              {product.description}
                            </div>
                          </div>
                        </td>
                        <td>{getCategoryName(product.categoryId)}</td>
                        <td>
                          ${product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px'
                          }}>
                            <StockIcon size={16} style={{ color: stockStatus.color }} />
                            <span style={{ fontWeight: '500' }}>
                              {product.stockQuantity}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            color: stockStatus.color,
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {stockStatus.text}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500' }}>
                            ${(product.price * product.stockQuantity).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            justifyContent: 'center' 
                          }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px' }}
                              onClick={() => openEditModal(product)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '8px 12px' }}
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        >
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSubmit={async (data: CreateProductRequest | UpdateProductRequest) => {
              if (editingProduct) {
                await handleUpdateProduct(editingProduct.id, data);
              } else {
                await handleCreateProduct(data as CreateProductRequest);
              }
            }}
            onCancel={closeModal}
          />
        </Modal>
      </div>
    </div>
  );
};

export default Products;
