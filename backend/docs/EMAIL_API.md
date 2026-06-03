# Email Admin API Documentation

## Overview
Sistema de gestión de correos con SMTP (Gmail). Permite crear, enviar, obtener y eliminar correos.

## Base URL
```
/admin/emails
```

## Endpoints

### 1. Obtener todos los correos
**GET** `/admin/emails`

Query Parameters:
- `status` (optional): `pending`, `sent`, `failed`, `bounced`
- `limit` (optional): 1-100, default: 50
- `skip` (optional): default: 0

Response:
```json
{
  "data": [...],
  "total": 123
}
```

---

### 2. Obtener estadísticas
**GET** `/admin/emails/statistics`

Response:
```json
{
  "total": 150,
  "sent": 120,
  "failed": 15,
  "pending": 15
}
```

---

### 3. Obtener correos pendientes
**GET** `/admin/emails/pending`

Response:
```json
{
  "data": [...]
}
```

---

### 4. Obtener correo por ID
**GET** `/admin/emails/:id`

Response:
```json
{
  "_id": "...",
  "recipient": "user@example.com",
  "subject": "Bienvenido",
  "body": "...",
  "status": "sent",
  "sentAt": "2026-06-01T...",
  "attempts": 1
}
```

---

### 5. Crear y enviar correo
**POST** `/admin/emails/create`

Body:
```json
{
  "recipient": "user@example.com",
  "subject": "Asunto del correo",
  "bodyText": "Contenido de texto",
  "htmlBody": "<p>Contenido HTML</p>",
  "template": "welcome",
  "metadata": { "userId": "123" }
}
```

Templates disponibles:
- `welcome` - Bienvenida
- `password_reset` - Recuperación de contraseña
- `verification` - Verificación de email
- `purchase_confirmation` - Confirmación de compra
- `custom` - Correo personalizado

---

### 6. Enviar correo existente
**POST** `/admin/emails/:id/send`

Reintenta enviar un correo que ya existe (útil para pendientes/fallidos).

---

### 7. Marcar como leído
**POST** `/admin/emails/:id/mark-read`

---

### 8. Reintentar correos fallidos
**POST** `/admin/emails/retry-failed`

Query Parameters:
- `maxAttempts` (optional): número máximo de reintentos, default: 3

---

### 9. Eliminar correo
**DELETE** `/admin/emails/:id`

---

### 10. Eliminar todos los correos
**DELETE** `/admin/emails`

Query Parameters:
- `status` (optional): solo elimina correos con este estado

---

## Autenticación
Todos los endpoints requieren:
- JWT Token en header `Authorization: Bearer <token>`
- Rol de `admin`

## Configuración SMTP (.env)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
SMTP_FROM=noreply@lbb.com
```

### Generar App Password en Gmail:
1. Habilitar 2-Step Verification en tu cuenta Google
2. Ir a: https://myaccount.google.com/apppasswords
3. Crear una contraseña para "Mail" y "Windows Computer"
4. Usar esa contraseña en `SMTP_PASS`

## Códigos de Estado HTTP
- `200` - OK
- `201` - Creado
- `400` - Error en la solicitud
- `401` - No autorizado
- `403` - Prohibido (no es admin)
- `404` - No encontrado
- `500` - Error del servidor
