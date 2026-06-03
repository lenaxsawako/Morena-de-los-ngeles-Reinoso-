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
            <p className="tos-label">Marco Legal</p>
            <h1 className="tos-title">Términos de Servicio</h1>
            <p className="tos-date">Última actualización: 24 de octubre de 2024</p>
          </header>

          {/* 1. Introduction */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">01</span>
              Introducción
            </h2>
            <div className="tos-section-content">
              <p>
                Bienvenido a Aurelius. Estos Términos de Servicio ("Términos") rigen tu acceso y uso del sitio web, boletines y productos literarios digitales proporcionados por Aurelius (el "Autor").
              </p>
              <p>
                Al acceder a nuestra biblioteca digital o comprar cualquiera de nuestras obras, reconoces que has leído, comprendido y aceptas estar obligado por estos Términos. Si no estás de acuerdo con estos Términos, abstente de usar la plataforma. Nuestro compromiso con la precisión intelectual requiere una comprensión mutua de estos parámetros.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 2. Intellectual Property */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">02</span>
              Propiedad Intelectual
            </h2>
            <div className="tos-section-content">
              <p>
                Todo el contenido disponible a través de Aurelius —incluyendo pero no limitado a manuscritos, ensayos, arte de portada, tipografía y diseño del sitio— es propiedad exclusiva del Autor y está protegido por leyes internacionales de derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
              </p>
              <p>
                La marca "Aurelius", incluido el logo e identificadores visuales específicos de identidad, son marcas registradas propietarias. Ninguna parte de estas obras puede ser reproducida, distribuida o transmitida en cualquier forma sin permiso previo por escrito, excepto para breves citas incorporadas en reseñas críticas.
              </p>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 3. Digital Access & Licensing */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">03</span>
              Acceso Digital y Licencias
            </h2>
            <div className="tos-section-content">
              <p>
                Cuando compras una obra digital de Aurelius, se te otorga una licencia personal no exclusiva, no transferible para acceder y leer el contenido para tu uso privado y no comercial.
              </p>
              <ul className="tos-list">
                <li>
                  <strong>Uso Personal:</strong> La licencia es para un individuo y no puede ser compartida entre múltiples cuentas o dispositivos no autorizados.
                </li>
                <li>
                  <strong>Sin Modificación:</strong> No puedes alterar, transformar o construir sobre la obra licenciada.
                </li>
                <li>
                  <strong>Revocación:</strong> Nos reservamos el derecho de terminar el acceso si se detecta distribución no autorizada o piratería.
                </li>
              </ul>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 4. User Conduct */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">04</span>
              Conducta del Usuario
            </h2>
            <div className="tos-section-content">
              <p>
                Como lector dentro del ecosistema Aurelius, aceptas interactuar con la plataforma y comunidad de una manera que refleje rigor intelectual y respeto mutuo. Las conductas prohibidas incluyen:
              </p>
              <div className="tos-grid">
                <div className="tos-grid-item">
                  <span className="material-symbols-outlined tos-grid-icon">block</span>
                  <h3 className="tos-grid-title">Extracción</h3>
                  <p className="tos-grid-text">Raspado automatizado de datos, recopilación o uso de modelos de IA para entrenar en nuestro texto propietario.</p>
                </div>
                <div className="tos-grid-item">
                  <span className="material-symbols-outlined tos-grid-icon">share_off</span>
                  <h3 className="tos-grid-title">Piratería</h3>
                  <p className="tos-grid-text">Compartir enlaces de descarga directa o archivos originales en foros públicos o redes de intercambio de archivos.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="tos-divider" />

          {/* 5. Limitations of Liability */}
          <section className="tos-section">
            <h2 className="tos-section-title">
              <span className="tos-section-number">05</span>
              Limitaciones de Responsabilidad
            </h2>
            <div className="tos-section-content">
              <p>
                El contenido proporcionado por Aurelius es solo para propósitos intelectuales y de entretenimiento. Si bien nos esforzamos por la precisión absoluta en nuestra investigación y prosa, el Autor proporciona el sitio web y su contenido en una base "tal cual".
              </p>
              <p>
                En la máxima medida permitida por la ley, Aurelius no será responsable por daños indirectos, incidentales o consecuentes que surjan de tu uso de la plataforma o la interpretación de las obras literarias contenidas aquí. Aceptas la responsabilidad total por el uso de cualquier información proporcionada.
              </p>
            </div>
          </section>

          {/* Newsletter Callout */}
          <div className="tos-newsletter">
            <div className="tos-newsletter-overlay" />
            <div className="tos-newsletter-content">
              <h3 className="tos-newsletter-title">Mantente Informado</h3>
              <p className="tos-newsletter-subtitle">
                Únete a nuestro círculo privado para actualizaciones filosóficas y acceso temprano a nuevos manuscritos.
              </p>
              <div className="tos-newsletter-form">
                <input
                  type="email"
                  placeholder="Tu dirección de correo electrónico"
                  className="tos-newsletter-input"
                />
                <button className="tos-newsletter-button">Suscribirse</button>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
