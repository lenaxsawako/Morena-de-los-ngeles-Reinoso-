import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { landingService } from '../../services/landing';
import './register.css';

export default function Register() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    landingService.getLandingData().then(data => {
      if (data.siteName) setSiteName(data.siteName);
    }).catch(() => {});
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [cardTransform, setCardTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only if hovering close to the card
      if (
        x > -100 &&
        x < rect.width + 100 &&
        y > -100 &&
        y < rect.height + 100
      ) {
        const moveX = (x - rect.width / 2) / 40;
        const moveY = (y - rect.height / 2) / 40;
        setCardTransform({ rotateY: moveX, rotateX: -moveY });
      } else {
        setCardTransform({ rotateX: 0, rotateY: 0 });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Limpiar errores cuando el usuario empieza a escribir
    setError(null);
  };

  const validateForm = (): string | null => {
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      return 'El email es requerido';
    }
    if (!emailRegex.test(formData.email)) {
      return 'Por favor ingresa un email válido';
    }

    // Validar contraseña
    if (!formData.password.trim()) {
      return 'La contraseña es requerida';
    }
    if (formData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }

    // Validar términos
    if (!formData.termsAccepted) {
      return 'Debes aceptar los Términos de Servicio y Política de Privacidad';
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
      await authService.register({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo...');
      
      // Redirigir al home o dashboard después de 1.5 segundos
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error durante el registro';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-progress" style={{ width: `${scrollProgress}%` }}></div>

      <main className="register-main">
        <div className="register-container">
          {/* Header Section */}
          <div className="register-header">
            <h1 className="register-title">Únete al Círculo</h1>
            <p className="register-subtitle">
              Crea una cuenta para guardar progreso, comprar libros y unirte a nuestra comunidad de lectura.
            </p>
          </div>

          {/* Registration Card */}
          <div
            ref={cardRef}
            className="register-card"
            style={{
              transform: `perspective(1000px) rotateX(${cardTransform.rotateX}deg) rotateY(${cardTransform.rotateY}deg)`,
            }}
          >
            {/* Atmospheric Glow Background */}
            <div className="register-card-glow"></div>

            <form className="register-form" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="register-error-message">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="register-success-message">
                  <span className="material-symbols-outlined">check_circle</span>
                  {successMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="register-input-group">
                <input
                  className="register-input peer"
                  id="email"
                  name="email"
                  type="email"
                  placeholder=" "
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
                <label className="register-label" htmlFor="email">
                  Dirección de Correo Electrónico
                </label>
              </div>

              {/* Password Grid */}
              <div className="register-password-grid">
                <div className="register-input-group">
                  <input
                    className="register-input peer"
                    id="password"
                    name="password"
                    type="password"
                    placeholder=" "
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                  <label className="register-label" htmlFor="password">
                    Contraseña
                  </label>
                </div>

                <div className="register-input-group">
                  <input
                    className="register-input peer"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder=" "
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                  <label className="register-label" htmlFor="confirmPassword">
                    Confirmar Contraseña
                  </label>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="register-terms">
                <div className="register-checkbox-wrapper">
                  <input
                    className="register-checkbox peer"
                    id="terms"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span className="register-checkmark material-symbols-outlined">
                    check
                  </span>
                </div>
                <label className="register-terms-label" htmlFor="terms">
                  Acepto los{' '}
                  <a href="#" className="register-link">
                    Términos de Servicio
                  </a>{' '}
                  y la{' '}
                  <a href="#" className="register-link">
                    Política de Privacidad
                  </a>
                  .
                </label>
              </div>

              {/* CTA Button */}
              <div className="register-button-wrapper">
                <button type="submit" className="register-button" disabled={isLoading}>
                  <span className="register-button-text">
                    {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                  </span>
                  <div className="register-button-overlay"></div>
                </button>
              </div>
            </form>

            {/* Secondary Option */}
            <div className="register-signin-prompt">
              <p>
                ¿Ya tienes una cuenta?
                <Link to="/login" className="register-signin-link">
                  Inicia sesión.
                </Link>
              </p>
            </div>
          </div>

          {/* Aesthetic Footer Note */}
          <p className="register-security-note">Asegurado por {siteName || 'Publisher'} Identity</p>
        </div>
      </main>
    </div>
  );
}
