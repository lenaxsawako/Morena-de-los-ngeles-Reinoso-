# Email API - CURL Examples

## 1. Obtener Token (Login primero)

```bash
# Register
curl -X POST http://localhost:3109/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"password123"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Guardar el token
TOKEN="tu_token_aqui"
```

## 2. Crear un correo nuevo

```bash
curl -X POST http://localhost:3109/admin/emails/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipient":"user@example.com",
    "subject":"Bienvenido a LBB",
    "bodyText":"Gracias por registrarte",
    "htmlBody":"<p>Gracias por registrarte en nuestra plataforma</p>",
    "template":"welcome",
    "metadata":{"userId":"123","action":"welcome"}
  }'
```

## 3. Obtener todos los correos

```bash
curl -X GET "http://localhost:3109/admin/emails?status=sent&limit=10&skip=0" \
  -H "Authorization: Bearer $TOKEN"
```

## 4. Obtener correos pendientes

```bash
curl -X GET http://localhost:3109/admin/emails/pending \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Obtener estadísticas

```bash
curl -X GET http://localhost:3109/admin/emails/statistics \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Obtener correo por ID

```bash
MAIL_ID="665a1234567890abcdef1234"

curl -X GET http://localhost:3109/admin/emails/$MAIL_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 7. Enviar correo (si está pendiente)

```bash
curl -X POST http://localhost:3109/admin/emails/$MAIL_ID/send \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Marcar como leído

```bash
curl -X POST http://localhost:3109/admin/emails/$MAIL_ID/mark-read \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Reintentar correos fallidos

```bash
curl -X POST "http://localhost:3109/admin/emails/retry-failed?maxAttempts=3" \
  -H "Authorization: Bearer $TOKEN"
```

## 10. Eliminar correo

```bash
curl -X DELETE http://localhost:3109/admin/emails/$MAIL_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 11. Eliminar todos los correos (por estado)

```bash
# Eliminar solo fallidos
curl -X DELETE "http://localhost:3109/admin/emails?status=failed" \
  -H "Authorization: Bearer $TOKEN"

# Eliminar todos
curl -X DELETE http://localhost:3109/admin/emails \
  -H "Authorization: Bearer $TOKEN"
```

## Notas Importantes

1. **SMTP Configuration (.env)**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu_email@gmail.com
   SMTP_PASS=tu_app_password
   SMTP_FROM=noreply@lbb.com
   ```

2. **Para Gmail App Password:**
   - Habilitar 2FA en cuenta Google
   - Ir a: https://myaccount.google.com/apppasswords
   - Generar contraseña para "Mail"
   - Usar esa contraseña en SMTP_PASS

3. **Estados de Correo:**
   - `pending` - Esperando envío
   - `sent` - Enviado exitosamente
   - `failed` - Error al enviar
   - `bounced` - Rechazado por servidor

4. **Roles Requeridos:**
   - Solo usuarios con rol `admin` pueden acceder a estos endpoints
