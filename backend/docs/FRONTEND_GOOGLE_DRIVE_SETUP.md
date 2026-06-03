# Frontend: Google Drive Setup - Guía de Integración

## 📝 Resumen de Cambios

Hemos simplificado la autenticación con Google Drive. **Ya no usamos OAuth2 con refresh tokens**, ahora usamos **Service Account JSON** que el administrador carga directamente en los settings.

### ¿Por qué cambió?

| Aspecto | Antes (OAuth2) | Ahora (Service Account) |
|--------|---|---|
| **Autenticación** | Refresh token + token access | Service Account privado |
| **Configuración** | 3 campos (clientId, clientSecret, refreshToken) | 1 JSON completo |
| **Complejidad** | Alto (autorización OAuth flow) | Bajo (solo upload JSON) |
| **Mantenimiento** | Tokens pueden expirar | Válido indefinidamente |
| **UX Admin** | Copiar-pegar 3 valores | Cargar 1 archivo JSON |

---

## 🚀 Cómo Funciona Ahora

### Flujo del Admin

```
1. Admin va a Google Cloud Console
   ↓
2. Descarga Service Account JSON
   ↓
3. Copia el JSON
   ↓
4. Entra a Admin Dashboard → Configuración Google Drive
   ↓
5. Pega el JSON
   ↓
6. Hace click en "Probar conexión"
   ↓
7. ¡Listo! El backend puede acceder a Google Drive
```

### Lo que hace el Backend

- Recibe el JSON en `PUT /admin/settings`
- Lo guarda en MongoDB (encriptado en BD)
- Crea un cliente GoogleAuth con esas credenciales
- Valida acceso a las carpetas configuradas
- Recarga automáticamente si hay cambios

---

## 🔧 Cambios en Endpoints

### New & Updated - Endpoints disponibles:

#### GET /admin/settings/list-drive-folders ✨ ACTUALIZADO

**Nuevo:** Ahora funciona con Service Account (antes usaba OAuth2)

**Uso:** Obtener lista de carpetas disponibles en Google Drive para un dropdown selector

```javascript
// Listar carpetas para selector
const response = await fetch('/admin/settings/list-drive-folders', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { folders } = await response.json();
console.log(folders); // [{id: '...', name: 'Folder Name'}, ...]
```

---

### Updated - Cambios en estructura de datos:

#### Antes (OAuth2):
```json
{
  "storage": {
    "googleDrive": {
      "enabled": true,
      "clientId": "123456.apps.googleusercontent.com",
      "clientSecret": "***",
      "refreshToken": "your-refresh-token",
      "booksFolderId": "folder-123",
      "coversFolderId": "folder-456"
    }
  }
}
```

#### Ahora (Service Account):
```json
{
  "storage": {
    "googleDrive": {
      "enabled": true,
      "serviceAccountJson": {
        "type": "service_account",
        "project_id": "lbb-project",
        "private_key_id": "key123",
        "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
        "client_email": "lbb@lbb-project.iam.gserviceaccount.com",
        "client_id": "123456789",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/..."
      },
      "booksFolderId": "folder-123",
      "coversFolderId": "folder-456"
    }
  }
}
```

---

## 💻 Cómo Implementarlo en Frontend

### 1. Crear Formulario de Upload

```jsx
import { useState } from 'react';

export function GoogleDriveSettings() {
  const [serviceAccountJson, setServiceAccountJson] = useState(null);
  const [booksFolderId, setBooksFolderId] = useState('');
  const [coversFolderId, setCoversFolderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setServiceAccountJson(json);
        setMessage('✅ JSON cargado correctamente');
      } catch (error) {
        setMessage('❌ Error: JSON inválido');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!serviceAccountJson || !booksFolderId || !coversFolderId) {
      setMessage('❌ Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          googleDrive: {
            enabled: true,
            serviceAccountJson,
            booksFolderId,
            coversFolderId
          }
        })
      });

      if (response.ok) {
        setMessage('✅ Configuración guardada');
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/admin/settings/test-drive', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('✅ Conexión exitosa a Google Drive');
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="google-drive-settings">
      <h2>Configuración Google Drive</h2>

      <div className="form-group">
        <label>Service Account JSON</label>
        <input 
          type="file" 
          accept=".json"
          onChange={handleFileUpload}
        />
        {serviceAccountJson && (
          <p className="success">✅ JSON: {serviceAccountJson.project_id}</p>
        )}
      </div>

      <div className="form-group">
        <label>Folder ID para PDFs de Libros</label>
        <input 
          type="text"
          placeholder="1a2b3c4d5e6f7g8h9i0j"
          value={booksFolderId}
          onChange={(e) => setBooksFolderId(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Folder ID para Portadas</label>
        <input 
          type="text"
          placeholder="2b3c4d5e6f7g8h9i0j1k"
          value={coversFolderId}
          onChange={(e) => setCoversFolderId(e.target.value)}
        />
      </div>

      <div className="actions">
        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={handleTest} disabled={loading}>
          {loading ? 'Probando...' : 'Probar Conexión'}
        </button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
```

---

## 📋 Paso a Paso: Obtener Service Account JSON

### Desde Google Cloud Console

1. **Ve a** [console.cloud.google.com](https://console.cloud.google.com/)

2. **Selecciona** o crea un proyecto nuevo

3. **Activa Google Drive API:**
   - Search: "Google Drive API"
   - Click en "Enable"

4. **Crea Service Account:**
   - Menu → APIs & Services → Credentials
   - Create Credentials → Service Account
   - Completa el formulario (nombre, descripción)
   - Click "Create and Continue"

5. **Crea Clave JSON:**
   - En la página del Service Account
   - Tab: "Keys"
   - Create New Key → JSON
   - Se descarga automáticamente: `lbb-project-xxxxx.json`

6. **Comparte carpetas en Google Drive:**
   - Abre Google Drive
   - Crea 2 carpetas (o usa existentes):
     - "LBB Books" (para PDFs)
     - "LBB Covers" (para portadas)
   - Haz clic derecho → Share
   - Pega el email del service account: `lbb@lbb-project.iam.gserviceaccount.com`
   - Rol: "Editor"
   - Share

7. **Obtén los Folder IDs:**
   - Abre cada carpeta en Google Drive
   - Copia de la URL: `drive.google.com/drive/folders/FOLDER_ID`
   - El ID es la parte larga: `1a2b3c4d5e6f7g8h9i0j`

---

## 🛡️ Seguridad

### ¿Qué pasa con el JSON?

- ✅ Se guarda en MongoDB con cifrado
- ✅ Nunca se retorna completo en GET (solo confirmación)
- ✅ Solo el backend lo usa para autenticarse
- ✅ El frontend NUNCA guarda el JSON localmente

### Mejores Prácticas

```javascript
// ✅ CORRECTO: Upload una sola vez
const handleUpload = async (json) => {
  const response = await fetch('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ googleDrive: { serviceAccountJson: json } })
  });
};

// ❌ INCORRECTO: No guardes en localStorage
localStorage.setItem('serviceAccountJson', JSON.stringify(json)); // ❌ NO

// ❌ INCORRECTO: No lo mandes al frontend
fetch('/admin/settings').then(data => {
  console.log(data.storage.googleDrive.serviceAccountJson); // ❌ NO SERÁ COMPLETO
});
```

---

## ✅ Checklist de Integración Frontend

- [ ] Crear página de Configuración Google Drive
- [ ] Input type="file" accept=".json"
- [ ] Parsear JSON en JavaScript
- [ ] Validar que serviceAccountJson no esté vacío
- [ ] Cargar carpetas automáticamente al subir JSON: `GET /admin/settings/list-drive-folders`
- [ ] Crear dropdowns para booksFolderId y coversFolderId (no inputs de texto)
- [ ] Botón "Guardar" → PUT /admin/settings
- [ ] Botón "Probar Conexión" → POST /admin/settings/test-drive
- [ ] Mostrar mensajes de error si no están configurados
- [ ] Deshabilitar dropdowns mientras se cargan carpetas

---

## 🔍 Errores Comunes

### Error: "Google Drive is not enabled"
```
Solución: Primero guarda la configuración, luego prueba la conexión
```

### Error: "Invalid service account JSON"
```
Solución: Verifica que:
1. El archivo es JSON válido (prueba en jsonlint.com)
2. Tiene los campos requeridos (type, private_key, client_email, etc)
3. No tiene caracteres ocultos o cortes
```

### Error: "Books folder ID not configured"
```
Solución: Asegúrate de completar AMBOS folder IDs
```

### Error: "401 Unauthorized"
```
Solución: El service account JSON es inválido o no tiene acceso a las carpetas
Pasos:
1. Verifica que el email del service account tiene acceso a ambas carpetas
2. Descarga un nuevo JSON desde Google Cloud
3. Copia-pega nuevamente
```

---

## 📚 Endpoints Disponibles

```http
# Obtener configuración actual
GET /admin/settings
Authorization: Bearer {token}

# Guardar/actualizar configuración
PUT /admin/settings
Authorization: Bearer {token}
Content-Type: application/json
Body: { "googleDrive": { "enabled": true, "serviceAccountJson": {...}, ... } }

# Probar conexión a Google Drive
POST /admin/settings/test-drive
Authorization: Bearer {token}

# Probar conexión SMTP (para emails)
POST /admin/settings/test-email
Authorization: Bearer {token}
```

---

## 🎯 Diferencias Clave vs Antes

| Acción | Antes (OAuth2) | Ahora (Service Account) |
|--------|---|---|
| **Obtener lista de carpetas** | GET /admin/settings/list-drive-folders | ✨ GET /admin/settings/list-drive-folders (mejorado) |
| **Almacenar credenciales** | 3 campos individuales | 1 JSON completo |
| **Renovar acceso** | Automático (refresh token) | Permanente (service account) |
| **Rotación de credenciales** | Cambiar refreshToken | Descargar nuevo JSON |
| **Complejidad UX** | Alta (OAuth flow) | Media (upload JSON + selector) |
| **Selector de carpetas** | Dropdown automático | Dropdown después de cargar JSON |

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del backend: `npm run start:dev`
2. Valida el JSON en [jsonlint.com](https://jsonlint.com/)
3. Verifica que el service account tiene acceso a las carpetas
4. Prueba la conexión con el botón "Probar Conexión"

¡Listo para integrar! 🚀
