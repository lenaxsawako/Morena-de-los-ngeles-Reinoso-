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
          <span className="pp-label">Privacidad de Información</span>
          <h1 className="pp-title">Nuestro Compromiso con tu Privacidad Intelectual</h1>
          <p className="pp-date">Efectivo desde el 24 de mayo de 2024. Un tratado de confianza entre el autor y el lector.</p>
        </header>

        <article className="pp-article">
          {/* Section 1: Data Collection */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">01</span>
              <h2 className="pp-section-title">Recopilación de Datos</h2>
            </div>
            <div className="pp-section-content">
              <p>
                En la búsqueda de la excelencia digital, Aurelius recopila solo los hilos esenciales de datos requeridos para mantener tu experiencia de biblioteca personalizada. Esto incluye tus credenciales de cuenta y preferencias de lectura, seleccionadas con el mismo cuidado que uno usaría para organizar una colección de manuscritos raros.
              </p>
              <p>
                No buscamos mapear tu huella digital completa; más bien, observamos tus interacciones dentro de nuestras propias paredes para entender mejor qué narrativas resuenan. Tu "Por qué" es tuyo; nuestro "Qué" se limita estrictamente a la mecánica funcional de tu estante digital.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 2: Cookies and Tracking */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">02</span>
              <h2 className="pp-section-title">Cookies y Rastreo</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Nuestro enfoque sobre rastreo es tan minimalista como nuestra tipografía. Utilizamos marcadores de sesión localizados —a menudo llamados cookies— para garantizar que tu transición entre capítulos sea perfecta. Estos marcadores digitales existen para recordar dónde lo dejaste, no para seguirte en la web más amplia.
              </p>
              <p>
                Rechazamos la arquitectura invasiva de píxeles publicitarios de terceros. Tu viaje a través de Aurelius sigue siendo un diálogo privado entre lector y texto.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 3: Data Protection */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">03</span>
              <h2 className="pp-section-title">Protección de Datos</h2>
            </div>
            <div className="pp-section-image-wrapper">
              <img
                alt="Cybersecurity abstraction"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWg_QCV63lpjq40UrIJbKjyZiA1lZDrbJoXn6ATU7bH0vUxN4r4oN8qpxtv_olyJawdaTeJ-ZxxFbXI0hE0pRW3biQQEhLcbbES1HkTDAmlRkAo37QVbi-u-4MpXS0Uk-wJXr2Co_oeccP4cMounFMvRxH5EQJ7Guap7LmAmT39rwfH66_dguspPOxlcN6FAH9ifCS_A-R2H_jrf-8jfi5efmY8qkSGIsrHT7uk7uvpHH7K8aLwNg9lKYfeSah67Mu0gW8FhPixA"
                className="pp-section-image"
              />
              <div className="pp-image-overlay" />
              <div className="pp-image-label">
                <span className="material-symbols-outlined">encrypted</span>
                <span>ENCRIPTADO EN REPOSO</span>
              </div>
            </div>
            <div className="pp-section-content">
              <p>
                Tu biblioteca está fortificada con encriptación estándar de la industria, comparable a las bóvedas de archivos antiguos. Aseguramos la biblioteca digital usando protocolos de autenticación multicapa y monitoreo persistente.
              </p>
              <p>
                Tratamos cada byte de datos de usuario como un artefacto sagrado. En el improbable caso de una violación de seguridad, nuestro protocolo de respuesta es rápido, transparente y guiado por una filosofía de "privacidad primero".
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 4: Third-Party Sharing */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">04</span>
              <h2 className="pp-section-title">Intercambio con Terceros</h2>
            </div>
            <div className="pp-quote-box">
              <p className="pp-quote">
                "Tus datos no son nuestro producto. Tu patrocinio es nuestro orgullo."
              </p>
              <p>
                Aurelius no —y nunca— venderá tus datos personales a intermediarios de terceros. Compartimos información solo con socios de servicio confiables esenciales para procesar transacciones o entregar contenido, todos los cuales están vinculados por los mismos estándares rigurosos de privacidad que mantenemos.
              </p>
            </div>
          </section>

          <div className="pp-divider" />

          {/* Section 5: Your Rights */}
          <section className="pp-section">
            <div className="pp-section-header">
              <span className="pp-section-number">05</span>
              <h2 className="pp-section-title">Tus Derechos</h2>
            </div>
            <div className="pp-section-content">
              <p>
                Como arquitecto de tu propia vida intelectual, retienes autoridad absoluta sobre tus datos. Puedes ejercer los siguientes derechos en cualquier momento a través de la configuración de tu Perfil:
              </p>
              <ul className="pp-rights-list">
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span><strong>Acceso:</strong> Solicita un registro completo de los datos que guardamos en tu nombre.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span><strong>Corrección:</strong> Enmienda cualquier inexactitud en tus registros personales.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span><strong>Eliminación:</strong> Solicita la eliminación total y permanente de tus datos de nuestros archivos.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Newsletter CTA */}
          <div className="pp-newsletter">
            <h3 className="pp-newsletter-title">Mantente Informado</h3>
            <p className="pp-newsletter-subtitle">
              Recibe actualizaciones sobre nuestras prácticas de privacidad y nuevos lanzamientos literarios. Prometemos una bandeja de entrada tranquila.
            </p>
            <div className="pp-newsletter-form">
              <input
                type="email"
                placeholder="Tu dirección de correo electrónico"
                className="pp-newsletter-input"
              />
              <button className="pp-newsletter-button">Suscribirse</button>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
