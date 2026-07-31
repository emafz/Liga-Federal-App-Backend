# Liga Federal App — Backend

API RESTful desarrollada en **Node.js** y **Express** con base de datos **MongoDB** para la gestión centralizada de usuarios, autenticación mediante **JWT**, control de acceso basado en roles (RBAC), auditoría de seguridad y almacenamiento optimizado de imágenes en la nube a través de **Cloudinary**.

---

## 🚀 Funcionalidades Principales

### 🔐 1. Autenticación y Control de Acceso (RBAC)
- **Inicio de Sesión Seguro**: Generación de tokens JWT (`jsonwebtoken`) con vencimiento configurable.
- **Protección de Rutas**: Middlewares de autenticación (`auth.middleware.js`) y verificación de roles (`role.middleware.js`).
- **Jerarquía de Permisos Granulares**:
  - **ROOT**: Control total del sistema, incluyendo eliminación física y consulta de cualquier usuario.
  - **ADMIN**: Gestión integral de usuarios (creación, lectura global, actualización y eliminación).
  - **USER**: Acceso restringido exclusivamente a la visualización y consulta de sus propios datos de perfil.
  - **GUEST**: Permisos altamente restringidos dentro del sistema.

### 🛡️ 2. Seguridad Avanzada y Auditoría
- **Rate Limiting Global**: Restricción de cantidad de peticiones permitidas por IP dentro de ventanas de tiempo definidas.
- **Protección Anti Fuerza Bruta**: Control riguroso de intentos fallidos de login por combinación IP + Email mediante `rate-limiter-flexible`.
- **Logs de Seguridad (SecurityLog)**: Registro automatizado en MongoDB de eventos sospechosos o bloqueos de acceso (`eventType`, `ip`, `method`, `path`, `userAgent`, `userEmail`).

### 🖼️ 3. Subida y Optimización de Imágenes en Cloudinary
- Integración con **Multer** y el SDK v2 de **Cloudinary**.
- Procesamiento en caliente para carga de imágenes en carpetas organizadas (`Liga_Federal/Avatar` y `Liga_Federal/Tarjetas`).
- Compresión automática y entrega en formatos adaptativos modernos (WebP/AVIF).

### 📋 4. Gestión Completa de Usuarios (CRUD)
- Validaciones estrictas en la capa DTO utilizando **Joi**.
- Encriptación segura de contraseñas con **bcryptjs**.
- Embebido de estructuras complejas (Avatar, Tarjeta de Personaje, Poder Especial y datos geográficos).

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| [Node.js](https://nodejs.org/) | Entorno de ejecución para JavaScript en el servidor |
| [Express](https://expressjs.com/) | Framework web para la construcción de la API REST |
| [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) | Base de datos NoSQL y ODM para modelado de datos |
| [JWT (jsonwebtoken)](https://jwt.io/) | Autenticación basada en tokens de acceso |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Encriptación y hasheado seguro de contraseñas |
| [Joi](https://joi.dev/) | Validación y sanitización de esquemas DTO de entrada |
| [Multer](https://github.com/expressjs/multer) + [Cloudinary SDK](https://cloudinary.com/) | Middleware de carga y almacenamiento de imágenes en la nube |
| [dotenv](https://github.com/motdotla/dotenv) | Gestión de variables de entorno |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | Limitación de tasa de solicitudes HTTP |
| [rate-limiter-flexible](https://github.com/animatespec/rate-limiter-flexible) | Protección contra ataques de fuerza bruta en autenticación |

---

## 📂 Arquitectura de Carpetas

```
src/
├── app.js                    # Inicialización del servidor Express y middlewares globales (CORS, Rate Limits)
│
├── config/                   # Ajustes de configuración e integraciones
│   ├── db.js                 # Conexión a MongoDB mediante Mongoose
│   ├── cloudinary.js         # Configuración e instanciación del SDK de Cloudinary
│   ├── cors.js               # Definición de políticas CORS y orígenes permitidos
│   └── env.js                # Carga y validación centralizada de variables de entorno
│
├── controllers/              # Controladores de peticiones HTTP (Manejo de Request/Response)
│   ├── auth.controller.js    # Manejador de endpoints de autenticación (/auth/login)
│   ├── user.controller.js    # Handlers para operaciones CRUD de usuarios
│   └── upload.controller.js  # Handlers para subida de avatares y tarjetas a Cloudinary
│
├── dto/                      # Esquemas de validación de objetos de transferencia de datos
│   └── user.dto.js           # Reglas de validación Joi para creación y modificación de usuarios
│
├── helpers/                  # Funciones de soporte y utilidades
│   └── response.helper.js    # Helper para estandarización de respuestas HTTP JSON
│
├── middlewares/              # Middlewares intermedios para peticiones Express
│   ├── auth.middleware.js    # Validación y decodificación de tokens Bearer JWT
│   ├── role.middleware.js    # Control de acceso por roles (RBAC)
│   ├── upload.middleware.js  # Interceptor Multer para recepción de archivos multipart
│   ├── rateLimiter.middleware.js # Limitador de peticiones por IP
│   └── bruteForce.middleware.js  # Control de intentos fallidos de login
│
├── models/                   # Definición de Esquemas y Modelos Mongoose
│   ├── user.model.js         # Modelo principal de Usuario (credenciales, perfil, poder, rol)
│   ├── securityLog.model.js  # Modelo para auditoría de eventos de seguridad
│   └── audit.model.js        # Modelo de auditoría general de cambios
│
├── routes/                   # Definición de rutas y enrutadores Express
│   ├── auth.routes.js        # Definición de rutas públicas de autenticación
│   └── user.routes.js        # Rutas protegidas para gestión de usuarios y subida de archivos
│
└── services/                 # Capa de lógica de negocio e interacción con la DB
    ├── auth.service.js       # Verificación de credenciales y firma de tokens JWT
    └── user.service.js       # Operaciones de persistencia y consultas a MongoDB
```

---

## ⚡ Cómo ejecutar el proyecto

### 1. Requisitos previos
- **Node.js**: v18 o superior
- **MongoDB**: Instancia local activa o URI de MongoDB Atlas
- **Cloudinary**: Cuenta activa con credenciales de API

### 2. Instalación
```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd Liga-Federal-App-Backend

# Instalar dependencias
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
PORT=7000

MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=mi_super_secreto
JWT_EXPIRES_IN=1h
FRONTEND_URLS=http://localhost:5173,http://localhost:3000

# RATE LIMIT API
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUEST=100

# LOGIN
LOGIN_WINDOW_MINUTES=15
LOGIN_MAX_ATTEPMTS=5
LOGIN_BLOCK_MINUTES=30

# CLOUDINARY PARA CARGAR FOTOS
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

### 4. Ejecución
```bash
# Modo desarrollo (con recarga automática mediante nodemon)
npm run dev

# Modo producción
npm start
```
La API quedará disponible en: `http://localhost:7000`

### 5. Scripts disponibles
| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo con Nodemon |
| `npm start` | Inicia la aplicación en modo producción |

---

## 👤 Modelo de Datos (User)

El modelo de usuario incluye información personal, localización, rol, atributos de seguridad y objetos embebidos para recursos multimedia y superpoderes:

- `nombre` (String, requerido)
- `apellido` (String, requerido)
- `alias` (String, opcional)
- `email` (String, único, requerido)
- `password` (String, encriptado con bcrypt)
- `fechaNacimiento` (Date, requerido)
- `edad` (Number, requerido)
- `genero` (String, requerido)
- `telefono` (String, requerido)
- `direccion` (String, requerido)
- `localidad` (String, requerido)
- `provincia` (String, requerido)
- `pais` (String, requerido)
- `codigoPostal` (String, requerido)
- `avatar`: `{ url: String, alt: String }`
- `tarjeta`: `{ url: String, alt: String }`
- `poder`: `{ nombre: String, descripcion: String }`
- `role`: Enum (`"ROOT"`, `"ADMIN"`, `"USER"`, `"GUEST"`)
- `ultimoLogin`: (Date, almacena la fecha del último acceso exitoso)

---

## 🔐 Autenticación y Autorización

Al realizar un login exitoso, la API devuelve un token JWT. Para acceder a los endpoints protegidos, debes incluir dicho token en la cabecera HTTP:

```http
Authorization: Bearer <token>
```

### Permisos por Rol en Listado de Usuarios (`GET /users`)
- **USER**: Solo puede visualizar su propia información de perfil.
- **ADMIN**: Puede visualizar a todos los usuarios, excepto aquellos con rol `ROOT`.
- **ROOT**: Acceso total para visualizar a todos los usuarios del sistema.
- **GUEST**: Recibe una respuesta HTTP 403 (Acceso Denegado).

---

## 📍 Endpoints de la API

### 1) Login (`POST /auth/login`)
- **Método**: `POST`
- **Ruta**: `/auth/login`
- **Autenticación**: No requerida

#### Body
```json
{
  "email": "usuario@example.com",
  "password": "123456"
}
```

#### Respuesta esperada
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "<jwt_token>",
    "role": "ADMIN"
  }
}
```

---

### 2) Listar Usuarios (`GET /users`)
- **Método**: `GET`
- **Ruta**: `/users`
- **Autenticación**: Requerida (`ROOT`, `ADMIN`, `USER`)

#### Query Params (Opcionales)
- `id`: Filtra por ID específico de usuario.
- `email`: Filtra por correo electrónico.

#### Ejemplo con cURL
```bash
curl http://localhost:7000/users \
  -H "Authorization: Bearer <token>"
```

---

### 3) Crear Usuario (`POST /users`)
- **Método**: `POST`
- **Ruta**: `/users`
- **Autenticación**: Requerida (`ROOT`, `ADMIN`)

#### Body
```json
{
  "nombre": "Emanuel",
  "apellido": "Fernandez",
  "alias": "Ema",
  "email": "emanuel@example.com",
  "password": "123456",
  "fechaNacimiento": "2000-01-01",
  "edad": 25,
  "genero": "Masculino",
  "telefono": "1122334455",
  "direccion": "Av. Siempre Viva 123",
  "localidad": "Córdoba",
  "provincia": "Córdoba",
  "pais": "Argentina",
  "codigoPostal": "5000",
  "avatar": {
    "url": "https://res.cloudinary.com/...",
    "alt": "Foto de avatar"
  },
  "tarjeta": {
    "url": "https://res.cloudinary.com/...",
    "alt": "Imagen de tarjeta"
  },
  "poder": {
    "nombre": "Super Fuerza",
    "descripcion": "Aumenta la fuerza en un 100%"
  },
  "role": "USER"
}
```

---

### 4) Actualizar Usuario (`PUT /users/:id`)
- **Método**: `PUT`
- **Ruta**: `/users/:id`
- **Autenticación**: Requerida (`ROOT`, `ADMIN`)

#### Body
Permite actualizar campos de forma parcial (a excepción de `email`).

```json
{
  "nombre": "Emanuel Actualizado",
  "edad": 39,
  "alias": "Ema Dev",
  "tarjeta": {
    "url": "https://res.cloudinary.com/...",
    "alt": "Nueva Tarjeta"
  }
}
```

---

### 5) Eliminar Usuario (`DELETE /users/:id`)
- **Método**: `DELETE`
- **Ruta**: `/users/:id`
- **Autenticación**: Requerida (`ROOT`, `ADMIN`)

```bash
curl -X DELETE http://localhost:7000/users/64f0c5d4f2b4d4a5c6e7f8a9 \
  -H "Authorization: Bearer <token>"
```

---

### 6) Subir Avatar a Cloudinary (`POST /upload/avatar`)
- **Método**: `POST`
- **Ruta**: `/upload/avatar`
- **Autenticación**: Requerida
- **Formato**: `multipart/form-data` con el campo `image`

Sube la imagen al directorio `Liga_Federal/Avatar` en Cloudinary con compresión automática y formato adaptativo (WebP/AVIF).

#### Ejemplo con cURL
```bash
curl -X POST http://localhost:7000/upload/avatar \
  -H "Authorization: Bearer <token>" \
  -F "image=@/ruta/a/imagen.jpg"
```

---

### 7) Subir Tarjeta a Cloudinary (`POST /upload/tarjeta`)
- **Método**: `POST`
- **Ruta**: `/upload/tarjeta`
- **Autenticación**: Requerida
- **Formato**: `multipart/form-data` con el campo `image`

Sube la imagen al directorio `Liga_Federal/Tarjetas` en Cloudinary.

#### Ejemplo con cURL
```bash
curl -X POST http://localhost:7000/upload/tarjeta \
  -H "Authorization: Bearer <token>" \
  -F "image=@/ruta/a/tarjeta.jpg"
```

---

## 🛡️ Protección de Seguridad y Auditoría

El backend incorpora mecanismos avanzados para mitigar ataques y auditar la actividad en la colección `SecurityLog` de MongoDB:

1. **Rate Limit Global**: Restringe la cantidad de peticiones permitidas por IP dentro de una ventana de tiempo.
2. **Protección contra Fuerza Bruta en Login**: Limita los intentos fallidos de login por combinación IP + Email.
3. **Logs de Seguridad en MongoDB**: Registra automáticamente detalles de peticiones sospechosas o bloqueadas (`eventType`, `ip`, `method`, `path`, `userAgent`, `userEmail`, `details`).

---

## 👥 Roles Disponibles

- **ROOT**: Control total sobre la infraestructura y datos del sistema.
- **ADMIN**: Gestión y supervisión general de usuarios.
- **USER**: Acceso estándar limitado a la consulta de sus propios datos.
- **GUEST**: Rol con permisos sumamente restringidos.
