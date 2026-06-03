# 📢 IMPORTANTE: Cómo Compartir Carpetas de Google Drive con el Service Account

## Problema: `GET /admin/settings/list-drive-folders` retorna 0 carpetas

Si el endpoint de listado de carpetas no te muestra ninguna, a pesar de que el Service Account JSON se cargó correctamente, es porque **las carpetas de Google Drive no han sido compartidas con el Service Account**.

Google Drive requiere que cada carpeta con la que quieras interactuar (leer, escribir, listar) sea explícitamente compartida con el correo electrónico del Service Account, incluso si este tiene los permisos de Drive API.

---

## 🔑 Tu Service Account ID

Según los logs de tu backend, el correo electrónico de tu Service Account es:

`prueba@drive-472423.iam.gserviceaccount.com`

**Necesitas compartir las carpetas en tu Google Drive personal con esta dirección de correo electrónico.**

---

## 📝 Pasos para Compartir las Carpetas

Sigue estos pasos cuidadosamente:

1.  **Abre Google Drive:**
    *   Ve a [https://drive.google.com/](https://drive.google.com/) en tu navegador e inicia sesión con tu cuenta de Google (la cuenta propietaria de las carpetas).

2.  **Identifica tus Carpetas de Libros y Portadas:**
    *   Localiza las carpetas que quieres que LBB use para almacenar los PDFs de los libros y las imágenes de las portadas (ej. `LBB Books`, `LBB Covers`). Si no las tienes, créalas ahora.

3.  **Comparte la Carpeta de Libros (`LBB Books`):
    *   Haz clic derecho sobre la carpeta `LBB Books`.
    *   Selecciona la opción **"Compartir" (Share)**.
    *   En el campo **"Añadir personas o grupos" (Add people or groups)**, pega el correo electrónico de tu Service Account:
        `prueba@drive-472423.iam.gserviceaccount.com`
    *   A la derecha del campo, selecciona el rol **"Editor"** (es crucial para que LBB pueda subir y gestionar archivos).
    *   Haz clic en el botón **"Compartir" (Share)** o **"Enviar" (Send)**.

4.  **Repite para la Carpeta de Portadas (`LBB Covers`):
    *   Haz el mismo proceso para la carpeta `LBB Covers` (o cualquier otra carpeta que uses para las portadas).

5.  **Verifica los Permisos (Opcional pero recomendado):
    *   Puedes verificar que los permisos se aplicaron correctamente haciendo clic derecho en la carpeta, yendo a "Compartir" y viendo que el Service Account aparece como "Editor".

---

## ✅ Después de Compartir

Una vez que hayas compartido ambas carpetas:

1.  **Vuelve a iniciar tu backend** (si lo habías detenido):
    `npm run start:dev`

2.  **Intenta de nuevo listar las carpetas** desde tu frontend o Postman/Thunder Client:
    `GET /admin/settings/list-drive-folders`

Ahora deberías ver las carpetas que compartiste en la lista de respuesta. Con esto, tu frontend podrá usarlas para el selector de carpetas.

¡Avísame si tienes algún problema o si las carpetas siguen sin aparecer!
