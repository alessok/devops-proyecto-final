import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users as UsersIcon, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      const response = await apiService.createUser(data);
      if (response.success && response.data) {
        setUsers([...users, response.data]);
        setIsModalOpen(false);
        toast.success('Usuario creado exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al crear usuario';
      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (id: number, data: UpdateUserRequest) => {
    try {
      const response = await apiService.updateUser(id, data);
      if (response.success && response.data) {
        setUsers(users.map(u => u.id === id ? response.data! : u));
        setIsModalOpen(false);
        setEditingUser(null);
        toast.success('Usuario actualizado exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar usuario';
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (currentUser?.id === id) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await apiService.deleteUser(id);
      if (response.success) {
        setUsers(users.filter(u => u.id !== id));
        toast.success('Usuario eliminado exitosamente');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar usuario';
      toast.error(errorMessage);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      [UserRole.ADMIN]: { backgroundColor: '#dc3545', color: 'white' },
      [UserRole.MANAGER]: { backgroundColor: '#fd7e14', color: 'white' },
      [UserRole.EMPLOYEE]: { backgroundColor: '#28a745', color: 'white' }
    };

    const labels = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.MANAGER]: 'Gerente',
      [UserRole.EMPLOYEE]: 'Empleado'
    };

    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          ...styles[role]
        }}
      >
        {labels[role]}
      </span>
    );
  };

  const canEditUser = (user: User): boolean => {
    if (!currentUser) return false;
    
    // Admins can edit anyone except themselves (for role changes)
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }
    
    // Managers can edit employees only
    if (currentUser.role === UserRole.MANAGER) {
      return user.role === UserRole.EMPLOYEE;
    }
    
    return false;
  };

  const canDeleteUser = (user: User): boolean => {
    if (!currentUser) return false;
    
    // Can't delete yourself
    if (currentUser.id === user.id) return false;
    
    // Admins can delete anyone except other admins
    if (currentUser.role === UserRole.ADMIN) {
      return user.role !== UserRole.ADMIN;
    }
    
    // Managers can delete employees only
    if (currentUser.role === UserRole.MANAGER) {
      return user.role === UserRole.EMPLOYEE;
    }
    
    return false;
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
            <h1 style={{ margin: 0, color: '#495057' }}>Usuarios</h1>
            <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
              Gestiona los usuarios del sistema ({filteredUsers.length} total)
            </p>
          </div>
          {currentUser?.role === UserRole.ADMIN && (
            <button 
              className="btn btn-primary"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Nuevo Usuario
            </button>
          )}
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
                  placeholder="Buscar usuarios por nombre, email o username..."
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="form-control"
                style={{ minWidth: '200px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              >
                <option value="">Todos los roles</option>
                <option value={UserRole.ADMIN}>Administradores</option>
                <option value={UserRole.MANAGER}>Gerentes</option>
                <option value={UserRole.EMPLOYEE}>Empleados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <UsersIcon size={64} style={{ marginBottom: '16px', color: '#6c757d' }} />
            <h3>No hay usuarios</h3>
            <p>
              {searchTerm || roleFilter
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'Comienza agregando usuarios al sistema'
              }
            </p>
            {!searchTerm && !roleFilter && currentUser?.role === UserRole.ADMIN && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                Crear Primer Usuario
              </button>
            )}
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {currentUser?.id === user.id && (
                            <Shield size={16} style={{ color: '#007bff' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: '500', color: '#495057' }}>
                              {user.firstName} {user.lastName}
                            </div>
                            {currentUser?.id === user.id && (
                              <div style={{ fontSize: '12px', color: '#007bff' }}>
                                (Tu cuenta)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>@{user.username}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: user.isActive ? '#d4edda' : '#f8d7da',
                          color: user.isActive ? '#155724' : '#721c24'
                        }}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                      <td>
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          justifyContent: 'center' 
                        }}>
                          {canEditUser(user) && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px' }}
                              onClick={() => openEditModal(user)}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDeleteUser(user) && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '8px 12px' }}
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {!canEditUser(user) && !canDeleteUser(user) && (
                            <span style={{ 
                              color: '#6c757d', 
                              fontSize: '12px',
                              padding: '8px 12px'
                            }}>
                              Sin permisos
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        >
          <UserForm
            user={editingUser}
            currentUserRole={currentUser?.role || UserRole.EMPLOYEE}
            onSubmit={async (data: CreateUserRequest | UpdateUserRequest) => {
              if (editingUser) {
                await handleUpdateUser(editingUser.id, data);
              } else {
                await handleCreateUser(data as CreateUserRequest);
              }
            }}
            onCancel={closeModal}
          />
        </Modal>
      </div>
    </div>
  );
};

export default Users;
