import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Package, Users, FolderOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0' }}>
          <div>
            <h2 style={{ color: '#007bff', margin: 0 }}>Inventario</h2>
          </div>
          
          <ul className="navbar-nav">
            <li>
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <BarChart3 size={18} />
                Dashboard
              </Link>
            </li>
            
            <li>
              <Link 
                to="/products" 
                className={`nav-link ${isActive('/products') ? 'active' : ''}`}
              >
                <Package size={18} />
                Productos
              </Link>
            </li>
            
            <li>
              <Link 
                to="/categories" 
                className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
              >
                <FolderOpen size={18} />
                Categorías
              </Link>
            </li>
            
            {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
              <li>
                <Link 
                  to="/users" 
                  className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                >
                  <Users size={18} />
                  Usuarios
                </Link>
              </li>
            )}
          </ul>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#495057', fontSize: '14px' }}>
              Hola, {user.firstName} ({user.role})
            </span>
            <button 
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: '8px 16px' }}
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
