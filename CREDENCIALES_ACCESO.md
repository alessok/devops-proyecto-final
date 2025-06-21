# 🔐 CREDENCIALES DE ACCESO - SISTEMA DE INVENTARIO

## 📱 APLICACIÓN FRONTEND
**URL**: [http://localhost:3000](http://localhost:3000)

---

## 👥 USUARIOS DISPONIBLES

### 🔴 ADMINISTRADOR (Acceso completo)
- **Email**: `admin@inventory.com`
- **Usuario**: `admin`
- **Contraseña**: `password`
- **Rol**: Administrador
- **Permisos**: Acceso completo a todas las funcionalidades

### 🟡 MANAGER (Gestión de inventario)
- **Email**: `manager@inventory.com`
- **Usuario**: `manager`
- **Contraseña**: `password`
- **Rol**: Manager
- **Permisos**: Gestión de productos, categorías e inventario

### 🟢 EMPLEADO (Solo lectura/operaciones básicas)
- **Email**: `employee@inventory.com`
- **Usuario**: `employee`
- **Contraseña**: `password`
- **Rol**: Empleado
- **Permisos**: Consulta de inventario y operaciones básicas

---

## 🖥️ PANTALLAS DISPONIBLES PARA TESTING

### 🏠 Dashboard Principal
- **URL**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Funcionalidad**: Estadísticas del sistema, resumen de inventario
- **Acceso**: Todos los roles

### 📦 Gestión de Productos
- **URL**: [http://localhost:3000/products](http://localhost:3000/products)
- **Funcionalidades**:
  - ✅ Listar productos
  - ✅ Crear nuevo producto
  - ✅ Editar producto existente
  - ✅ Eliminar producto
  - ✅ Búsqueda y filtros
- **Acceso**: Admin y Manager (lectura para Employee)

### 🏷️ Gestión de Categorías
- **URL**: [http://localhost:3000/categories](http://localhost:3000/categories)
- **Funcionalidades**:
  - ✅ Listar categorías
  - ✅ Crear nueva categoría
  - ✅ Editar categoría existente
  - ✅ Eliminar categoría
- **Acceso**: Admin y Manager (lectura para Employee)

### 👥 Gestión de Usuarios
- **URL**: [http://localhost:3000/users](http://localhost:3000/users)
- **Funcionalidades**:
  - ✅ Listar usuarios
  - ✅ Crear nuevo usuario
  - ✅ Editar usuario existente
  - ✅ Cambiar roles y permisos
- **Acceso**: Solo Administrador

### 📊 Reportes
- **URL**: [http://localhost:3000/reports](http://localhost:3000/reports)
- **Funcionalidades**:
  - ✅ Reportes de inventario
  - ✅ Análisis de productos
  - ✅ Estadísticas por categoría
- **Acceso**: Admin y Manager

---

## 🔄 FLUJO DE TESTING RECOMENDADO

### 1️⃣ TESTING COMO ADMINISTRADOR
```
1. Acceder con admin@inventory.com / password
2. Verificar dashboard con todas las estadísticas
3. Crear una nueva categoría
4. Crear un nuevo producto
5. Gestionar usuarios (crear/editar/eliminar)
6. Generar reportes
7. Cerrar sesión
```

### 2️⃣ TESTING COMO MANAGER
```
1. Acceder con manager@inventory.com / password
2. Verificar dashboard (sin acceso a usuarios)
3. Gestionar productos (CRUD completo)
4. Gestionar categorías (CRUD completo)
5. Generar reportes de inventario
6. Cerrar sesión
```

### 3️⃣ TESTING COMO EMPLEADO
```
1. Acceder con employee@inventory.com / password
2. Verificar dashboard (solo lectura)
3. Consultar productos (solo lectura)
4. Consultar categorías (solo lectura)
5. Sin acceso a usuarios ni reportes avanzados
6. Cerrar sesión
```

---

## 🛠️ SERVICIOS ADICIONALES PARA TESTING

### 📊 Grafana (Monitoreo)
- **URL**: [http://localhost:3003](http://localhost:3003)
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### 🔍 Prometheus (Métricas)
- **URL**: [http://localhost:9090](http://localhost:9090)

### 🧪 SonarQube (Calidad de Código)
- **URL**: [http://localhost:9000](http://localhost:9000)
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### 🐘 Base de Datos (PostgreSQL)
- **Host**: `localhost:5432`
- **Base de datos**: `inventory_db`
- **Usuario**: `postgres`
- **Contraseña**: `postgres123`

---

## 📝 DATOS PRE-CARGADOS

### 🏷️ Categorías Disponibles:
1. Electrónicos
2. Ropa
3. Hogar
4. Deportes
5. Libros
6. Alimentación

### 📦 Productos de Ejemplo:
- iPhone 14 (Electrónicos)
- Samsung Galaxy S23 (Electrónicos)
- MacBook Pro (Electrónicos)
- Camiseta Polo (Ropa)
- Jeans Levi's (Ropa)
- Lámpara LED (Hogar)
- Sofá 3 plazas (Hogar)
- Bicicleta MTB (Deportes)
- Pesas 10kg (Deportes)
- El Quijote (Libros)
- Café Premium (Alimentación)
- Aceite de Oliva (Alimentación)

---

## ⚠️ NOTAS IMPORTANTES

1. **Contraseña Universal**: Todos los usuarios tienen la contraseña `password`
2. **Roles Diferenciados**: Cada usuario tiene diferentes niveles de acceso
3. **Datos Persistentes**: Los datos se mantienen entre reinicios del contenedor
4. **API Pública**: Las rutas `/api/v1/public/*` no requieren autenticación
5. **Autenticación JWT**: El sistema utiliza tokens JWT para la autenticación

---

## 🚀 COMANDOS ÚTILES

### Reiniciar solo el frontend:
```bash
docker-compose restart frontend
```

### Ver logs en tiempo real:
```bash
docker-compose logs -f frontend backend
```

### Verificar salud de contenedores:
```bash
docker-compose ps
```

### Acceso directo a la base de datos:
```bash
docker-compose exec postgres psql -U postgres -d inventory_db
```

---

**🎯 SISTEMA LISTO PARA TESTING COMPLETO**
**✅ Todos los servicios operativos**
**✅ Base de datos con datos de prueba**
**✅ Autenticación funcionando**
**✅ Diferentes roles configurados**
