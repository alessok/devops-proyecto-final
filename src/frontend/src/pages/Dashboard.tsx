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
        
        // Try to fetch dashboard stats first
        try {
          const dashboardResponse = await fetch('http://localhost:3002/api/v1/dashboard/stats');
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            if (dashboardData.success && dashboardData.data) {
              setStats(dashboardData.data);
              await fetchLowStockProducts();
              return;
            }
          }
        } catch (error) {
          console.log('Dashboard stats not available, calculating from products...');
        }

        // Fallback: calculate stats from products
        const productsResponse = await apiService.getPublicProducts();
        if (productsResponse.success && productsResponse.data) {
          const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
          const calculatedStats: DashboardStats = {
            totalProducts: products.length,
            totalCategories: new Set(products.map(p => {
              if (typeof p.category === 'string') return p.category;
              if (typeof p.category === 'object' && p.category?.name) return p.category.name;
              return p.categoryId || 'Unknown';
            })).size,
            totalUsers: 3, // Default value
            lowStockProducts: products.filter(p => {
              const stock = p.stockQuantity || p.stock || 0;
              return Number(stock) < 10;
            }).length,
            totalValue: products.reduce((sum, p) => {
              const price = typeof p.price === 'number' ? p.price : parseFloat(String(p.price) || '0');
              const stock = Number(p.stockQuantity || p.stock || 0);
              return sum + (price * stock);
            }, 0)
          };
          setStats(calculatedStats);
        }
        
        await fetchLowStockProducts();

      } catch (error: any) {
        toast.error('Error al cargar datos del dashboard');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Remove stats dependency to avoid infinite loop

  const fetchLowStockProducts = async (): Promise<void> => {
    try {
      const response = await apiService.getLowStockProducts();
      if (response.success && response.data) {
        setLowStockProducts(response.data);
      } else {
        // Fallback: get all products and filter for low stock
        const allProductsResponse = await apiService.getPublicProducts();
        if (allProductsResponse.success && allProductsResponse.data) {
          const lowStock = allProductsResponse.data.filter(product => {
            const quantity = product.stockQuantity ?? product.stock ?? 0;
            return quantity < 10;
          });
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
                        Categoría: {
                          typeof product.category === 'string' 
                            ? product.category 
                            : product.category?.name || 'Sin categoría'
                        }
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: (product.stockQuantity || product.stock || 0) === 0 ? '#dc3545' : '#fd7e14' 
                      }}>
                        {product.stockQuantity || product.stock || 0} unidades
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        ${typeof product.price === 'number' 
                          ? product.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })
                          : parseFloat(String(product.price) || '0').toLocaleString('es-ES', { minimumFractionDigits: 2 })
                        }
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
