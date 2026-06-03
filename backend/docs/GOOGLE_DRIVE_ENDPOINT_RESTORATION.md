# 📢 Notificación: Restauración del Endpoint de Listado de Carpetas

## ¿Qué pasó?

Inicialmente eliminé el endpoint `GET /admin/settings/list-drive-folders` durante la migración de OAuth2 a Service Account. **Fue un error de juicio** - no debería haberlo eliminado, solo adaptarlo.

## ✅ Lo que cambió

### Estado Anterior (hace poco):
- ❌ Endpoint `GET /admin/settings/list-drive-folders` **REMOVIDO**
- Frontend necesitaba copiar-pegar Folder IDs manualmente
- UX más compleja

### Estado Actual (AHORA):
- ✅ Endpoint `GET /admin/settings/list-drive-folders` **RESTAURADO**
- Funciona con Service Account (no OAuth2)
- Frontend puede mostrar dropdown selector de carpetas
- UX mejorada

---

## 🔄 Endpoint Restaurado

### GET /admin/settings/list-drive-folders

**Propósito:** Obtener lista de todas las carpetas del Google Drive del service account

**URL:**
```
GET /admin/settings/list-drive-folders
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK):**
```json
{
  "folders": [
    {
      "id": "1a2b3c4d5e6f7g8h9i0j",
      "name": "LBB Books",
      "webViewLink": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j"
    },
    {
      "id": "2b3c4d5e6f7g8h9i0j1k",
      "name": "LBB Covers",
      "webViewLink": "https://drive.google.com/drive/folders/2b3c4d5e6f7g8h9i0j1k"
    },
    {
      "id": "3c4d5e6f7g8h9i0j1k2l",
      "name": "Other Folder",
      "webViewLink": "https://drive.google.com/drive/folders/3c4d5e6f7g8h9i0j1k2l"
    }
  ]
}
```

**Error Cases:**
- `400 Bad Request`: Google Drive no habilitado o JSON no configurado
- `401 Unauthorized`: Service Account JSON inválido
- `500 Internal Server Error`: Error al conectar con Google Drive

---

## 💻 Cómo Reintegrar en Frontend

### Paso 1: Agregar estado para carpetas

```jsx
const [folders, setFolders] = useState([]);
const [loadingFolders, setLoadingFolders] = useState(false);
```

### Paso 2: Crear función para cargar carpetas

```jsx
const loadFolders = async () => {
  setLoadingFolders(true);
  try {
    const response = await fetch('/admin/settings/list-drive-folders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const { folders } = await response.json();
      setFolders(folders);
      setMessage('✅ Carpetas cargadas correctamente');
    } else {
      const error = await response.json();
      setMessage(`❌ Error: ${error.message}`);
    }
  } catch (error) {
    setMessage(`❌ Error: ${error.message}`);
  } finally {
    setLoadingFolders(false);
  }
};
```

### Paso 3: Llamar a loadFolders() después de cargar JSON

```jsx
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target.result);
      setServiceAccountJson(json);
      setMessage('✅ JSON cargado correctamente');
      
      // 🆕 NUEVO: Auto-cargar carpetas después del JSON
      loadFolders();
    } catch (error) {
      setMessage('❌ Error: JSON inválido');
    }
  };
  reader.readAsText(file);
};
```

### Paso 4: Reemplazar inputs de texto con selects

**Antes (copiar-pegar manual):**
```jsx
<div className="form-group">
  <label>Folder ID para PDFs de Libros</label>
  <input 
    type="text"
    placeholder="1a2b3c4d5e6f7g8h9i0j"
    value={booksFolderId}
    onChange={(e) => setBooksFolderId(e.target.value)}
  />
</div>
```

**Ahora (dropdown):**
```jsx
<div className="form-group">
  <label>Folder para PDFs de Libros</label>
  <select 
    value={booksFolderId}
    onChange={(e) => setBooksFolderId(e.target.value)}
    disabled={loadingFolders}
  >
    <option value="">Selecciona una carpeta...</option>
    {folders.map(folder => (
      <option key={folder.id} value={folder.id}>
        {folder.name}
      </option>
    ))}
  </select>
  {folders.length === 0 && (
    <small>Carga el JSON primero para ver las carpetas</small>
  )}
</div>
```

### Paso 5: Lo mismo para coversFolderId

```jsx
<div className="form-group">
  <label>Folder para Portadas</label>
  <select 
    value={coversFolderId}
    onChange={(e) => setCoversFolderId(e.target.value)}
    disabled={loadingFolders}
  >
    <option value="">Selecciona una carpeta...</option>
    {folders.map(folder => (
      <option key={folder.id} value={folder.id}>
        {folder.name}
      </option>
    ))}
  </select>
</div>
```

---

## 🎨 Flujo Actualizado en Frontend

```
1. Admin carga Service Account JSON
   ↓
2. Frontend llama GET /admin/settings/list-drive-folders
   ↓
3. Backend devuelve lista de carpetas
   ↓
4. Frontend llena los dropdowns con carpetas
   ↓
5. Admin selecciona carpeta para libros
   ↓
6. Admin selecciona carpeta para portadas
   ↓
7. Admin hace click "Guardar"
   ↓
8. Frontend envía PUT /admin/settings con IDs seleccionados
   ↓
9. ¡Configurado!
```

---

## 📋 Checklist: Lo que debes actualizar

- [ ] Agregar estado `folders` y `loadingFolders`
- [ ] Crear función `loadFolders()` que llame GET /admin/settings/list-drive-folders
- [ ] Llamar `loadFolders()` en `handleFileUpload()` después de parsear JSON
- [ ] Reemplazar input text para booksFolderId con select dropdown
- [ ] Reemplazar input text para coversFolderId con select dropdown
- [ ] Deshabilitar dropdowns mientras se cargan (`disabled={loadingFolders}`)
- [ ] Mostrar mensaje "Carga el JSON primero" cuando no hay carpetas
- [ ] Probar todo en navegador

---

## 🧪 Testing en Frontend

```javascript
// Test 1: Cargar JSON
// → Deberías ver mensaje "✅ JSON cargado correctamente"
// → Los dropdowns deberían estar cargando

// Test 2: Esperar carga de carpetas
// → Los dropdowns deberían mostrar lista de carpetas
// → Deberías ver "✅ Carpetas cargadas correctamente"

// Test 3: Seleccionar carpetas
// → Selecciona "LBB Books" para booksFolderId
// → Selecciona "LBB Covers" para coversFolderId

// Test 4: Guardar
// → Click "Guardar"
// → Deberías ver "✅ Configuración guardada"

// Test 5: Probar conexión
// → Click "Probar Conexión"
// → Deberías ver "✅ Conexión exitosa a Google Drive"
```

---

## 📚 Endpoints Disponibles (Resumen)

```http
# Upload JSON y probar conexión
PUT /admin/settings
Authorization: Bearer {token}
Content-Type: application/json

# NUEVO: Listar carpetas disponibles
GET /admin/settings/list-drive-folders
Authorization: Bearer {token}

# Probar conexión (después de guardar)
POST /admin/settings/test-drive
Authorization: Bearer {token}
```

---

## ⚠️ Notas Importantes

1. **Orden de operaciones:** Primero carga el JSON, luego se llena el selector
2. **No es manual:** No pidas al usuario que copie folder IDs - déjalo seleccionar
3. **Mejor UX:** Dropdown es mejor que texto manual
4. **Error handling:** Si la carga de carpetas falla, muestra error claro

---

## 🤔 Preguntas Frecuentes

**Q: ¿Por qué eliminaste el endpoint?**
A: Fue un error inicial pensando que simplificaba la UX. Realicé que un dropdown es mejor UX que copiar-pegar.

**Q: ¿Funciona con Service Account?**
A: Sí, 100% funciona con Service Account. Es exactamente lo mismo que OAuth2 pero más simple.

**Q: ¿Necesito hacer cambios en el backend?**
A: No, el backend ya está actualizado. Solo necesitas reintegrar en el frontend.

**Q: ¿Se pueden editar los folder IDs después?**
A: Sí, el selector está siempre disponible - solo recarga el formulario.

---

## 📞 Support

Si tienes problemas:

1. Verifica que el JSON se cargó correctamente
2. Comprueba la consola del navegador (DevTools)
3. Revisa los logs del backend: `npm run start:dev`
4. Prueba el endpoint manualmente en Postman/Thunder Client

¡Listo para reintegrar! 🚀
