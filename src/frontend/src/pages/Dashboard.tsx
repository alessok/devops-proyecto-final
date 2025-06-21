import React, { useState, useEffect } from 'react';
import { Package, Users, FolderOpen, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { DashboardStats, Product } from '../types';
import apiService from '../services/apiService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats and low stock products in parallel
        const [productsResponse] = await Promise.all([
          apiService.getProducts(),
          fetchLowStockProducts()
        ]);

        if (productsResponse.success && productsResponse.data) {
          // Calculate stats from products data if API doesn't provide dashboard stats
          if (!stats) {
            const products = productsResponse.data;
            const calculatedStats: DashboardStats = {
              totalProducts: products.length,
              totalCategories: new Set(products.map(p => p.categoryId)).size,
              totalUsers: 0, // We'll need to fetch users for this
              lowStockProducts: products.filter(p => p.stockQuantity < 10).length,
              totalValue: products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)
            };
            setStats(calculatedStats);
          }
        }

      } catch (error: any) {
        toast.error('Error al cargar datos del dashboard');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [stats]);

  const fetchLowStockProducts = async (): Promise<void> => {
    try {
      const response = await apiService.getLowStockProducts();
      if (response.success && response.data) {
        setLowStockProducts(response.data);
      } else {
        // Fallback: get all products and filter for low stock
        const allProductsResponse = await apiService.getProducts();
        if (allProductsResponse.success && allProductsResponse.data) {
          const lowStock = allProductsResponse.data.filter(product => product.stockQuantity < 10);
          setLowStockProducts(lowStock);
        }
      }
    } catch (error) {
      console.error('Error fetching low stock products:', error);
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
    <div className="dashboard">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: 0, color: '#495057' }}>Dashboard</h1>
          <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
            Vista general del sistema de inventario
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <Package size={32} style={{ marginBottom: '16px' }} />
            <div className="stat-number">{stats?.totalProducts || 0}</div>
            <div className="stat-label">Productos Totales</div>
          </div>

          <div className="stat-card categories">
            <FolderOpen size={32} style={{ marginBottom: '16px' }} />
            <div className="stat-number">{stats?.totalCategories || 0}</div>
            <div className="stat-label">Categorías</div>
          </div>

          <div className="stat-card users">
            <Users size={32} style={{ marginBottom: '16px' }} />
            <div className="stat-number">{stats?.totalUsers || 0}</div>
            <div className="stat-label">Usuarios</div>
          </div>

          <div className="stat-card products">
            <TrendingUp size={32} style={{ marginBottom: '16px' }} />
            <div className="stat-number">
              ${stats?.totalValue ? stats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="stat-label">Valor Total</div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} style={{ color: '#dc3545' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#495057' }}>
                    Productos con Stock Bajo
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                    {lowStockProducts.length} productos necesitan reposición
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: '12px' }}>
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div 
                    key={product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', color: '#495057' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        Categoría: {product.category?.name || 'Sin categoría'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: product.stockQuantity === 0 ? '#dc3545' : '#fd7e14' 
                      }}>
                        {product.stockQuantity} unidades
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        ${product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {lowStockProducts.length > 5 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '12px',
                    color: '#6c757d',
                    fontSize: '14px'
                  }}>
                    y {lowStockProducts.length - 5} productos más...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, color: '#495057' }}>Acciones Rápidas</h3>
          </div>
          <div className="card-body">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/products/new'}
                style={{ padding: '16px', textAlign: 'left' }}
              >
                <Package size={20} style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '500' }}>Agregar Producto</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  Crear un nuevo producto
                </div>
              </button>

              <button 
                className="btn btn-success"
                onClick={() => window.location.href = '/categories/new'}
                style={{ padding: '16px', textAlign: 'left' }}
              >
                <FolderOpen size={20} style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '500' }}>Nueva Categoría</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  Organizar productos
                </div>
              </button>

              <button 
                className="btn btn-secondary"
                onClick={() => window.location.href = '/products'}
                style={{ padding: '16px', textAlign: 'left' }}
              >
                <AlertTriangle size={20} style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '500' }}>Revisar Stock</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  Gestionar inventario
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
