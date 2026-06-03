import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      return 'El email es requerido';
    }
    if (!emailRegex.test(email)) {
      return 'Por favor ingresa un email válido';
    }
    if (!password.trim()) {
      return 'La contraseña es requerida';
    }
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessMessage('¡Login exitoso! Redirigiendo...');
      
      // Redirigir al home después de 1.5 segundos
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error durante el login';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setError(null);
  };

  return (
    <div className="login-wrapper">
      <div className="login-progress" style={{ width: `${scrollProgress}%` }}></div>

      <main className="login-main">
        <div className="login-container">
          {/* Brand Mark / Logo */}
          <div className="login-brand-mark">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>

          {/* Login Card */}
          <div className="login-card">
            {/* Atmospheric background element */}
            <div className="login-card-atmosphere"></div>

            <div className="login-card-content">
              {/* Header */}
              <div className="login-header">
                <h1 className="login-title">Bienvenido de Nuevo</h1>
                <p className="login-subtitle">
                  Inicia sesión para acceder a tu biblioteca y continuar tu viaje.
                </p>
              </div>

              {/* Form */}
              <form className="login-form" onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                  <div className="login-error-message">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="login-success-message">
                    <span className="material-symbols-outlined">check_circle</span>
                    {successMessage}
                  </div>
                )}

                {/* Email Input */}
                <div className="login-input-group">
                  <label htmlFor="email" className="login-label">
                    Dirección de Correo Electrónico
                  </label>
                  <div className="login-input-underline">
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      className="login-input"
                      value={email}
                      onChange={handleInputChange(setEmail)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="login-input-group">
                  <div className="login-password-header">
                    <label htmlFor="password" className="login-label">
                      Contraseña
                    </label>
                    <Link to="/forgot-password" className="login-forgot-password">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="login-input-underline">
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="login-input"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="login-button-wrapper">
                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="login-signup-prompt">
                <p>
                  ¿No tienes una cuenta?
                  <Link to="/register" className="login-signup-link">
                    Crear una.
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Visual Support / Atmospheric Images */}
          <div className="login-images-grid">
            <div className="login-image-container">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOZigRWbXEqITo9osXdj7VtwgDTsP1KQyUk1b7EJAFjEPjd83zMxjeueDV4payS0n4Oyb1voEijCVG780s_ryTG9dJGyit8JxDjFlGZL15rogECGzMxw_aF3p-bCByu9qMPZHOUkTQcvu-SmeJarVR-M62ysEpbZJOP6gJzHvih6Iv37d1oHIBuOnMG-tSrvIcC1XHOY-ItFBV81c_eFRsX2djRR88OQkJ_f1b5olLCWZ1VO0_XVuNse8rOP3CSuuGweKM1PO9jg"
                alt="Book pages"
                className="login-image"
              />
            </div>
            <div className="login-image-container login-image-container-offset">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0cQVAVoFNQqgcxddzgiKCTJChKFTfQlCo3fWC_3kCCEQSb0BhsJPXUYUjI2DOjipma971mhmY471KV1u0HoWzkeneVZPloLXuiq_K7B_k4-p6KQgQitPXhitpeFTsvPm4zrpaKyqmTja50MQ0WqKGfaW_7BMO7EkiZTaHW7yo9MkEia4CVfodd7723nYsY3B1E8aa0xh9j6HgpvGHOYuQUJNNwdWdahelpLDQaRM4CufL4fdzkP0LJdP2Yh83hUJfWrc1KXtsgg"
                alt="Fountain pen"
                className="login-image"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
