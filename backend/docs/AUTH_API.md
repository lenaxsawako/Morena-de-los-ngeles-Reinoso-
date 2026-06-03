# Auth API Documentation

## Base URL
```
http://localhost:3109/auth
```

---

## 1. Register - Crear Nuevo Usuario

**POST** `/auth/register`

### Request
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

### Request Body Schema
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `email` | string | ✅ Sí | Email válido |
| `password` | string | ✅ Sí | Mínimo 6 caracteres |

### Response - 201 Created
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJzdWIiOiI2NjdhMTIzNDU2Nzg5MGFiY2RlZjEyMzQiLCJpYXQiOjE3NzAwNjcyMDAsImV4cCI6MTc3MDA2NzkyMH0.abc123..."
}
```

### Error Responses

**400 Bad Request** - Email ya registrado
```json
{
  "message": "Email already registered",
  "error": "Bad Request",
  "statusCode": 400
}
```

**400 Bad Request** - Validación fallida
```json
{
  "message": [
    "email debe ser válido",
    "Password debe tener al menos 6 caracteres"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### CURL Example
```bash
curl -X POST http://localhost:3109/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

### JavaScript/TypeScript Example
```typescript
const response = await fetch('http://localhost:3109/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data.access_token); // Token JWT
```

---

## 2. Login - Iniciar Sesión

**POST** `/auth/login`

### Request
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

### Request Body Schema
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `email` | string | ✅ Sí | Email válido |
| `password` | string | ✅ Sí | Mínimo 6 caracteres |

### Response - 200 OK
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzdWFyaW9AZXhhbXBsZS5jb20iLCJzdWIiOiI2NjdhMTIzNDU2Nzg5MGFiY2RlZjEyMzQiLCJpYXQiOjE3NzAwNjcyMDAsImV4cCI6MTc3MDA2NzkyMH0.abc123..."
}
```

### Error Responses

**401 Unauthorized** - Credenciales inválidas
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**400 Bad Request** - Validación fallida
```json
{
  "message": [
    "email debe ser válido",
    "Password debe tener al menos 6 caracteres"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### CURL Example
```bash
curl -X POST http://localhost:3109/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

### JavaScript/TypeScript Example
```typescript
const response = await fetch('http://localhost:3109/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'password123'
  })
});

const data = await response.json();
if (response.ok) {
  localStorage.setItem('token', data.access_token);
  console.log('Login exitoso');
} else {
  console.error('Credenciales inválidas');
}
```

---

## 3. Get Current User - Obtener Usuario Actual

**GET** `/auth/me`

### Headers Requeridos
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Response - 200 OK
```json
{
  "_id": "667a1234567890abcdef1234",
  "email": "usuario@example.com",
  "purchasedBooks": [
    "book_001",
    "book_002",
    "book_003"
  ],
  "roles": ["user"],
  "isActive": true,
  "emailVerified": true,
  "emailVerificationToken": null,
  "passwordResetToken": null,
  "passwordResetExpiresAt": null,
  "lastLoginAt": "2026-06-02T12:04:28.123Z",
  "profile": {
    "username": "juan_perez",
    "avatar": "https://example.com/avatars/juan_perez.jpg",
    "bio": "Amante de la lectura y la tecnología"
  },
  "preferences": {
    "theme": "dark",
    "fontSize": 16
  },
  "metadata": {
    "lastIpAddress": "192.168.1.100",
    "deviceType": "desktop",
    "referralCode": "REF123ABC"
  },
  "createdAt": "2026-05-15T10:30:45.678Z",
  "updatedAt": "2026-06-02T12:04:28.123Z"
}
```

### Error Responses

**401 Unauthorized** - Token inválido o no incluido
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**404 Not Found** - Usuario no encontrado
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### CURL Example
```bash
curl -X GET http://localhost:3109/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/TypeScript Example
```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3109/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const user = await response.json();
console.log('Usuario actual:', user);
console.log('Email:', user.email);
console.log('Roles:', user.roles);
```

### Notas
- Requiere un JWT token válido
- El token debe estar en el header `Authorization` como `Bearer <token>`
- El token expira después de 1 hora
- No retorna el `passwordHash` por seguridad
- Retorna toda la información del usuario incluyendo preferencias y metadata

---

### Estructura
El token JWT contiene:
- `email` - Email del usuario
- `sub` - ID del usuario en MongoDB
- `iat` - Fecha de emisión
- `exp` - Fecha de expiración (1 hora)

### Cómo Usar el Token

Para acceder a endpoints protegidos, incluye el token en el header:

```bash
curl -X GET http://localhost:3109/admin/emails \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

En JavaScript:
```typescript
const token = localStorage.getItem('token');

fetch('http://localhost:3109/admin/emails', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Flujo Completo

### 1. Registrar usuario
```bash
curl -X POST http://localhost:3109/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@example.com",
    "password": "seguro123"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im51ZXZvQGV4YW1wbGUuY29tIiwic3ViIjoiNjY3YzEyMzQ1Njc4OTBhYmNkZWYxMjM0IiwiaWF0IjoxNzc2MDY4MTY4LCJleHAiOjE3NzYwNjg3Njh9.dGVzdHNpZ25hdHVyZQ=="
}
```

### 2. Guardar token
```typescript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im51ZXZvQGV4YW1wbGUuY29tIiwic3ViIjoiNjY3YzEyMzQ1Njc4OTBhYmNkZWYxMjM0IiwiaWF0IjoxNzc2MDY4MTY4LCJleHAiOjE3NzYwNjg3Njh9.dGVzdHNpZ25hdHVyZQ==";
localStorage.setItem('token', token);
console.log('Token guardado exitosamente');
```

### 3. Obtener datos del usuario
```bash
curl -X GET http://localhost:3109/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Respuesta:
```json
{
  "_id": "667c1234567890abcdef1234",
  "email": "nuevo@example.com",
  "purchasedBooks": [],
  "roles": ["user"],
  "isActive": true,
  "emailVerified": false,
  "profile": {
    "username": null,
    "avatar": null,
    "bio": null
  },
  "preferences": {
    "theme": "light",
    "fontSize": 14
  },
  "metadata": {
    "registrationSource": "web"
  },
  "createdAt": "2026-06-02T14:22:48.123Z",
  "updatedAt": "2026-06-02T14:22:48.123Z"
}
```

### 4. Usar token en requests posteriores
```bash
curl -X GET http://localhost:3109/admin/emails \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Validaciones

### Email
- Debe ser un email válido (ej: user@example.com)
- Debe ser único en la BD
- Se almacena en minúsculas

### Password
- Mínimo 6 caracteres
- Se hashea con bcrypt antes de almacenarse
- Nunca se devuelve en las respuestas

---

## Ejemplo Completo de Uso (JavaScript)

```typescript
// 1. Registrar nuevo usuario
async function register() {
  const response = await fetch('http://localhost:3109/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'usuario@example.com',
      password: 'password123'
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Registro exitoso');
    console.log('Token:', data.access_token);
    localStorage.setItem('token', data.access_token);
    return data.access_token;
  } else {
    console.error('❌ Error en registro:', data.message);
  }
}

// 2. Iniciar sesión (Login)
async function login() {
  const response = await fetch('http://localhost:3109/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'usuario@example.com',
      password: 'password123'
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Login exitoso');
    console.log('Token:', data.access_token);
    localStorage.setItem('token', data.access_token);
    return data.access_token;
  } else {
    console.error('❌ Credenciales inválidas');
  }
}

// 3. Obtener datos del usuario actual
async function getCurrentUser() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No hay token disponible');
    return null;
  }

  const response = await fetch('http://localhost:3109/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const user = await response.json();
  
  if (response.ok) {
    console.log('✅ Usuario obtenido:');
    console.log('Email:', user.email);
    console.log('ID:', user._id);
    console.log('Roles:', user.roles);
    console.log('Libros comprados:', user.purchasedBooks.length);
    console.log('Perfil:', user.profile);
    console.log('Preferencias:', user.preferences);
    return user;
  } else {
    console.error('❌ Error al obtener usuario:', user.message);
  }
}

// 4. Usar el flujo completo
async function authFlow() {
  console.log('=== FLUJO DE AUTENTICACIÓN ===\n');
  
  // Registro
  console.log('1️⃣ Registrando usuario...');
  await register();
  
  console.log('\n2️⃣ Iniciando sesión...');
  await login();
  
  console.log('\n3️⃣ Obteniendo datos del usuario...');
  const user = await getCurrentUser();
  
  if (user) {
    console.log('\n✅ Flujo completado exitosamente');
    console.log('Usuario autenticado:', user.email);
  }
}

// Ejecutar
authFlow().catch(console.error);
```

---

| Código | Significado | Causa |
|--------|-------------|-------|
| 200 | OK | Login exitoso |
| 201 | Created | Usuario registrado exitosamente |
| 400 | Bad Request | Validación fallida, email duplicado |
| 401 | Unauthorized | Credenciales inválidas |
| 500 | Server Error | Error interno del servidor |
