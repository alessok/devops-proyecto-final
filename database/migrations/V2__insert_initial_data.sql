-- Insertar datos iniciales para el sistema de inventario
-- Archivo: V4__insert_initial_data.sql

-- Insertar usuario administrador por defecto
INSERT INTO users (email, username, password, first_name, last_name, role) VALUES 
('admin@inventory.com', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin'),
('manager@inventory.com', 'manager', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manager', 'User', 'manager'),
('employee@inventory.com', 'employee', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Employee', 'User', 'employee');

-- Insertar categorías iniciales
INSERT INTO categories (name, description) VALUES 
('Electrónicos', 'Dispositivos electrónicos y gadgets'),
('Ropa', 'Prendas de vestir y accesorios'),
('Hogar', 'Artículos para el hogar y decoración'),
('Deportes', 'Equipamiento deportivo y fitness'),
('Libros', 'Libros y material educativo'),
('Alimentación', 'Productos alimenticios y bebidas');

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, stock_quantity, category_id) VALUES 
('iPhone 14', 'Smartphone Apple iPhone 14 128GB', 999.99, 25, 1),
('Samsung Galaxy S23', 'Smartphone Samsung Galaxy S23 256GB', 899.99, 30, 1),
('MacBook Pro', 'Laptop Apple MacBook Pro 13" M2', 1299.99, 15, 1),
('Camiseta Polo', 'Camiseta polo algodón 100%', 29.99, 100, 2),
('Jeans Levi''s', 'Pantalón jeans clásico Levi''s 501', 79.99, 75, 2),
('Lámpara LED', 'Lámpara de escritorio LED regulable', 49.99, 50, 3),
('Sofá 3 plazas', 'Sofá cómodo de 3 plazas color gris', 599.99, 10, 3),
('Bicicleta MTB', 'Bicicleta de montaña 21 velocidades', 399.99, 20, 4),
('Pesas 10kg', 'Set de pesas ajustables hasta 10kg', 89.99, 35, 4),
('El Quijote', 'Don Quijote de la Mancha - Cervantes', 19.99, 200, 5),
('Café Premium', 'Café colombiano premium molido 500g', 12.99, 150, 6),
('Aceite de Oliva', 'Aceite de oliva extra virgen 1L', 8.99, 80, 6);
