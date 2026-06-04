import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../ForgotPassword/forgotpassword.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Error al restablecer contraseña');
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fp-wrapper">
      <main className="fp-main">
        <div className="fp-container">
          {!success ? (
            <>
              <div className="fp-header">
                <h1 className="fp-title">Nueva Contraseña</h1>
                <p className="fp-subtitle">
                  Ingresá tu nueva contraseña.
                </p>
              </div>

              <form className="fp-card" onSubmit={handleSubmit}>
                <div className="fp-card-glow" />

                <div className="fp-form">
                  <div className="fp-input-group">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder=" "
                      className="fp-input peer"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <label htmlFor="password" className="fp-label">
                      Nueva Contraseña
                    </label>
                  </div>

                  <div className="fp-input-group">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder=" "
                      className="fp-input peer"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <label htmlFor="confirmPassword" className="fp-label">
                      Confirmar Contraseña
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
                        <span className="fp-button-text">Restablecer Contraseña</span>
                      )}
                    </button>
                  </div>

                  {error && <p className="fp-error">{error}</p>}

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
                <h3 className="fp-success-title">Contraseña Restablecida</h3>
                <p className="fp-success-text">
                  Tu contraseña se ha cambiado correctamente. Redirigiendo al inicio de sesión...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
