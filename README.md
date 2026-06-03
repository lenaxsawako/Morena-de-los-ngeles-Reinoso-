# Plataforma de Publicación de Libros

Backend (NestJS + MongoDB) y frontend (React + Vite + Tailwind) para publicar, vender y leer libros digitales en PDF con pagos integrados vía Polar.

## Estructura

```
backend/    – API REST (NestJS + MongoDB)
frontend/   – Cliente web (React + Vite + Tailwind)
```

## Requisitos

- Node.js 18+
- MongoDB (Atlas o local)
- Cuenta en [Polar](https://polar.sh) para pagos

## Instalación

```bash
# Backend
cd backend
npm install
cp .env.example .env   # configurar variables
npm run start:dev

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

### Backend (`.env`)

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Conexión a MongoDB |
| `JWT_SECRET` | Secreto para JWT |
| `PORT` | Puerto del servidor (3109) |
| `CORS_ORIGINS` | Orígenes permitidos |
| `FRONTEND_URL` | URL del frontend para redirección de checkout |

### Frontend (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend (ej. `http://localhost:3109`) |

## Docker

El backend se puede levantar en Docker (la DB es Atlas, no local):

```bash
cd backend
cp .env.docker .env
# editar .env con tus credenciales de Atlas
docker compose up -d
```

## Comandos útiles

```bash
# Backend
npm run start:dev   # Desarrollo con hot-reload
npm run build       # Compilar
npm run lint        # Lint

# Frontend
npm run dev         # Desarrollo
npm run build       # Build producción
```

## Admin

Acceder a `/admin` después de iniciar sesión con un usuario administrador.

### Crear admin

```bash
cd backend
node scripts/create-admin.js <email> <password>
```
