import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './forgotpassword.css';

export default function ForgotPassword() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [formData, setFormData] = useState({ email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular envío
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fp-wrapper">
      <div
        className="fp-progress"
        style={{ width: `${scrollProgress}%` }}
      />

      <main className="fp-main">
        <div className="fp-container">
          {!isSubmitted ? (
            <>
              <div className="fp-header">
                <h1 className="fp-title">Restaurar Acceso</h1>
                <p className="fp-subtitle">
                  Ingresa tu dirección de correo y te enviaremos un enlace para restablecer tu contraseña y volver a tu biblioteca.
                </p>
              </div>

              <form className="fp-card" onSubmit={handleSubmit}>
                <div className="fp-card-glow" />

                <div className="fp-form">
                  <div className="fp-input-group">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder=" "
                      className="fp-input peer"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="email" className="fp-label">
                      Dirección de Correo
                    </label>
                  </div>

                  <div className="fp-button-wrapper">
                    <button
                      type="submit"
                      className="fp-button"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="material-symbols-outlined fp-spinner">
                          progress_activity
                        </span>
                      ) : (
                        <span className="fp-button-text">Enviar Enlace de Restablecimiento</span>
                      )}
                    </button>
                  </div>

                  <div className="fp-back-link">
                    <Link to="/login" className="fp-link">
                      <span className="material-symbols-outlined">arrow_back</span>
                      Volver al Inicio de Sesión
                    </Link>
                  </div>
                </div>
              </form>

              <div className="fp-divider" />
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="fp-success-content">
                <h3 className="fp-success-title">Enlace Enviado</h3>
                <p className="fp-success-text">
                  Hemos enviado un enlace de recuperación a <span className="fp-email">{formData.email}</span>. Por favor revisa tu bandeja de entrada.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ email: '' });
                }}
                className="fp-resend-button"
              >
                Reenviar Correo
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
