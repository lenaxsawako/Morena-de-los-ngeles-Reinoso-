import { useState, useEffect } from 'react';
import './privacypolicy.css';

export default function PrivacyPolicy() {
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
    <div className="pp-wrapper">
      <div className="pp-progress" style={{ width: `${scrollProgress}%` }} />

      <main className="pp-main">
        {/* Header Section */}
        <header className="pp-header">
          <span className="pp-label">Privacidad de Datos</span>
          <h1 className="pp-title">Qué Datos Recopilamos y Por Qué</h1>
          <p className="pp-date">Última actualización: junio de 2026</p>
        </header>

        <article className="pp-article">
          {/* Section 1: Datos de Cuenta */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">01</span>
              <h2 className="pp-section-title">Datos de Cuenta</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Para usar la plataforma necesitás crear una cuenta. Recopilamos tu <strong>correo electrónico</strong> y un <strong>nombre</strong> (el que elijas). La <strong>contraseña</strong> se almacena cifrada (hash + salt) — nunca la vemos ni la guardamos en texto plano.
              </p>
              <p>
                Podés agregar un <strong>avatar</strong> de forma opcional. Estos datos son necesarios para identificar tu biblioteca, sincronizar tu progreso de lectura entre dispositivos y procesar tus compras.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 2: Progreso de Lectura */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">02</span>
              <h2 className="pp-section-title">Progreso de Lectura</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Guardamos automáticamente la <strong>página actual</strong> donde vas leyendo, el <strong>porcentaje de avance</strong> y la <strong>fecha de última lectura</strong> de cada libro. Esto permite que retomés la lectura exactamente donde la dejaste, incluso si cambiás de dispositivo.
              </p>
              <p>
                Si no iniciás sesión, este progreso se almacena únicamente en tu navegador (localStorage). Al iniciar sesión, se sincroniza con nuestros servidores para que no pierdas tu lugar.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 3: Compras y Pagos */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">03</span>
              <h2 className="pp-section-title">Compras y Pagos</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Cuando comprás un libro, registramos el <strong>libro adquirido</strong>, el <strong>monto</strong>, la <strong>moneda</strong> y un <strong>identificador de transacción</strong> proporcionado por el procesador de pagos.
              </p>
              <p>
                <strong>No almacenamos</strong> números de tarjeta, datos bancarios ni información de facturación. Todo el procesamiento de pagos lo realiza <strong>Polar</strong> (nuestro proveedor de pagos), que cumple con los estándares de seguridad PCI. Los datos que nosotros vemos se limitan a confirmar si el pago fue exitoso o no.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 4: Marcadores y Favoritos */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">04</span>
              <h2 className="pp-section-title">Marcadores y Favoritos</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Podés guardar <strong>marcadores</strong> en páginas específicas con una nota opcional, y <strong>marcar libros como favoritos</strong>. Estos datos están asociados a tu cuenta y nos permiten ofrecerte una experiencia de lectura personalizada.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 5: Reseñas */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">05</span>
              <h2 className="pp-section-title">Reseñas</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Si publicás una <strong>reseña</strong> o <strong>calificación</strong> (de 1 a 5 estrellas), esta se asocia a tu perfil y se muestra públicamente junto con tu nombre. Podés editar o eliminar tus reseñas en cualquier momento desde tu perfil.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 6: Datos Técnicos */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">06</span>
              <h2 className="pp-section-title">Datos Técnicos</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Cuando usás la plataforma, registramos tu <strong>dirección IP</strong> de forma temporal para prevenir abusos y garantizar la seguridad. También registramos el <strong>navegador</strong> y <strong>sistema operativo</strong> de forma anónima para mejorar la compatibilidad.
              </p>
              <p>
                Usamos <strong>tokens de sesión almacenados localmente en tu navegador (localStorage)</strong> para mantener tu sesión activa. No usamos cookies de rastreo publicitario ni compartimos datos con redes de anuncios.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 7: Suscripción */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">07</span>
              <h2 className="pp-section-title">Suscripciones y Newsletters</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Si te suscribís a nuestro newsletter, guardamos tu <strong>correo electrónico</strong> y el <strong>estado de la suscripción</strong> (activa/inactiva). Podés cancelar la suscripción en cualquier momento desde el perfil o usando el enlace al pie de cada correo.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 8: Servicios de Terceros */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">08</span>
              <h2 className="pp-section-title">Servicios de Terceros</h2>
            </div>
            <div className="pp-quote-box">
              <p className="pp-quote">
                "No vendemos ni alquilamos tus datos personales a nadie."
              </p>
              <p>
                El único servicio externo que procesa datos personales de los usuarios es <strong>Polar</strong>, nuestro procesador de pagos. Ellos manejan la información de pago; nosotros solo recibimos la confirmación de si la transacción fue exitosa o no.
              </p>
              <p style={{ marginTop: '1rem' }}>
                El resto de la infraestructura (almacenamiento de archivos, imágenes) es interna y no involucra datos de los usuarios.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 9: Tus Derechos */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">09</span>
              <h2 className="pp-section-title">Tus Derechos</h2>
            </div>
            <div className="pp-section-content">
              <p>
                En cualquier momento podés:
              </p>
              <ul className="pp-rights-list">
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span><strong>Acceder</strong> a todos los datos que tenemos asociados a tu cuenta.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span><strong>Corregir</strong> tu nombre, email o avatar desde la configuración del perfil.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span><strong>Eliminar</strong> tu cuenta y todos tus datos asociados de forma permanente.</span>
                </li>
              </ul>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 10: Contacto */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">10</span>
              <h2 className="pp-section-title">Contacto</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Si tenés preguntas sobre esta política, querés ejercer tus derechos o reportar un problema de seguridad, podés escribirnos a través del formulario de contacto en tu perfil o enviar un correo a la dirección indicada en la configuración del sitio.
              </p>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
