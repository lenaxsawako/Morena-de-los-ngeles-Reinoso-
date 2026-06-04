import { useState, useEffect } from 'react';
import './tos.css';

export default function TermsOfService() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="tos-wrapper">
      <div className="tos-progress" style={{ width: `${scrollProgress}%` }} />

      <main className="tos-main">
        <article className="tos-article">
          {/* Header */}
          <header className="tos-header">
            <p className="tos-label">Términos Legales</p>
            <h1 className="tos-title">Términos de Servicio</h1>
            <p className="tos-date">Última actualización: junio de 2026</p>
          </header>

          {/* 1. Aceptación */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">01</span>
              Aceptación de los Términos
            </h2>
            <div className="tos-section-content">
              <p>
                Al crear una cuenta, acceder o usar esta plataforma ("el Servicio"), aceptás estos Términos de Servicio. Si no estás de acuerdo, no uses el Servicio.
              </p>
              <p>
                Este es un servicio de venta de libros digitales (PDF) operado por el administrador del sitio. No está afiliado a ninguna editorial externa.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 2. Cuentas */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">02</span>
              Cuentas de Usuario
            </h2>
            <div className="tos-section-content">
              <p>
                Para comprar libros y usar el lector digital necesitás una cuenta. Seleccionarás un nombre y una contraseña. La contraseña se almacena cifrada; sos responsable de mantenerla segura.
              </p>
              <p>
                No compartas tu cuenta con otras personas. No crees cuentas múltiples para evadir compras o restricciones. Si detectamos actividad fraudulenta, podemos suspender tu cuenta sin previo aviso.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 3. Compras */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">03</span>
              Compras y Pagos
            </h2>
            <div className="tos-section-content">
              <p>
                Los libros se compran de forma individual. El precio se muestra antes de la compra. Los pagos son procesados por <strong>Polar</strong>, un procesador de pagos externo. No almacenamos números de tarjeta ni datos bancarios.
              </p>
              <p>
                Una vez realizada la compra, el libro se agrega a tu biblioteca de forma permanente. Por la naturaleza digital del producto, <strong>no se realizan reembolsos</strong> salvo que el libro esté defectuoso o no coincida con la descripción.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 4. Vista Previa */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">04</span>
              Vista Previa Gratuita
            </h2>
            <div className="tos-section-content">
              <p>
                Las primeras páginas de cada libro están disponibles de forma gratuita para que puedas evaluar el contenido antes de comprar. El número de páginas gratuitas lo define el administrador y puede variar por libro.
              </p>
              <p>
                Para acceder al libro completo, deberás comprarlo. Sin la compra, las páginas más allá de la vista previa estarán bloqueadas.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 5. Licencia de Uso */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">05</span>
              Licencia de Uso
            </h2>
            <div className="tos-section-content">
              <p>
                Al comprar un libro, se te otorga una <strong>licencia personal, no exclusiva, no transferible</strong> para leer el contenido dentro de la plataforma. Esto significa que:
              </p>
              <ul className="tos-list">
                <li><strong>Podés</strong> leer el libro en cualquier dispositivo donde iniciés sesión con tu cuenta.</li>
                <li><strong>No podés</strong> descargar, redistribuir, vender ni compartir los archivos PDF originales.</li>
                <li><strong>No podés</strong> usar el contenido para entrenar modelos de inteligencia artificial ni extraer datos de forma automatizada.</li>
                <li><strong>No podés</strong> modificar, adaptar ni crear obras derivadas del contenido.</li>
              </ul>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 6. Conducta */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">06</span>
              Conducta del Usuario
            </h2>
            <div className="tos-section-content">
              <p>
                Al usar el Servicio, aceptás no:
              </p>
              <div className="tos-grid">
                <div className="tos-grid-item">
                  <span className="material-symbols-outlined tos-grid-icon">block</span>
                  <h3 className="tos-grid-title">Piratería</h3>
                  <p className="tos-grid-text">Compartir enlaces de descarga, archivos o credenciales para evitar la compra.</p>
                </div>
                <div className="tos-grid-item">
                  <span className="material-symbols-outlined tos-grid-icon">gavel</span>
                  <h3 className="tos-grid-title">Abuso</h3>
                  <p className="tos-grid-text">Publicar reseñas falsas, spam, contenido ofensivo o acosar a otros usuarios.</p>
                </div>
                <div className="tos-grid-item">
                  <span className="material-symbols-outlined tos-grid-icon">automation</span>
                  <h3 className="tos-grid-title">Automatización</h3>
                  <p className="tos-grid-text">Usar bots, scrapers o cualquier método automatizado para acceder al contenido.</p>
                </div>
                <div className="tos-grid-item">
                  <span className="material-symbols-outlined tos-grid-icon">security</span>
                  <h3 className="tos-grid-title">Seguridad</h3>
                  <p className="tos-grid-text">Intentar vulnerar la seguridad, realizar ingeniería inversa o interferir con el funcionamiento del sitio.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 7. Contenido Generado */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">07</span>
              Contenido Generado por el Usuario
            </h2>
            <div className="tos-section-content">
              <p>
                Las reseñas y calificaciones que publicás son visibles públicamente junto con tu nombre de usuario. Conservás todos los derechos sobre el contenido que publicás, pero nos otorgás una licencia para mostrarlo dentro de la plataforma.
              </p>
              <p>
                Nos reservamos el derecho de eliminar reseñas que consideremos inapropiadas, falsas o que violen estos términos.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 8. Terminación */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">08</span>
              Terminación de Cuenta
            </h2>
            <div className="tos-section-content">
              <p>
                Podés eliminar tu cuenta en cualquier momento desde la configuración del perfil. Al hacerlo, se eliminarán todos tus datos personales, progreso de lectura, reseñas y marcadores.
              </p>
              <p>
                Nosotros podemos suspender o terminar tu cuenta si violás estos términos (por ejemplo, distribución no autorizada de contenido). En esos casos, no se realizarán reembolsos por compras previas.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 9. Limitación */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">09</span>
              Limitación de Responsabilidad
            </h2>
            <div className="tos-section-content">
              <p>
                El Servicio se proporciona "tal cual", sin garantías de ningún tipo. No garantizamos que el servicio sea ininterrumpido, libre de errores o seguro.
              </p>
              <p>
                En la máxima medida permitida por la ley, no seremos responsables por daños indirectos, pérdida de datos, interrupción del servicio o cualquier otro daño que surja del uso o la imposibilidad de usar el Servicio.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 10. Cambios */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">10</span>
              Cambios a estos Términos
            </h2>
            <div className="tos-section-content">
              <p>
                Podemos actualizar estos términos en cualquier momento. Los cambios entrarán en vigor al ser publicados en esta página. El uso continuado del Servicio después de cualquier modificación constituye la aceptación de los nuevos términos.
              </p>
              <p>
                Te recomendamos revisar esta página periódicamente. La fecha de la última actualización se muestra al inicio del documento.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 11. Contacto */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">11</span>
              Contacto
            </h2>
            <div className="tos-section-content">
              <p>
                Si tenés preguntas sobre estos términos, podés contactarnos a través del formulario en tu perfil o por los medios indicados en la configuración del sitio.
              </p>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}