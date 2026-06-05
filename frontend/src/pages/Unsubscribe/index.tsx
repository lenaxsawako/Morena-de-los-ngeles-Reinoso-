import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { subscriptionService } from '../../services/subscription';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setStatus('error');
      setMessage('No se proporcionó un correo electrónico.');
      return;
    }
    subscriptionService.unsubscribe(email)
      .then(res => {
        setStatus('success');
        setMessage(res.message || 'Te desuscribiste correctamente.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Error al desuscribir. El enlace puede haber expirado.');
      });
  }, [email]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
    textAlign: 'center',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: '1rem',
  };

  return (
    <div style={containerStyle}>
      {status === 'loading' && (
        <>
          <div style={iconStyle} className="material-symbols-outlined">pending</div>
          <h1>Procesando...</h1>
          <p>Estamos procesando tu solicitud de desuscripción.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ ...iconStyle, color: '#4caf50' }} className="material-symbols-outlined">check_circle</div>
          <h1>¡Desuscripción Exitosa!</h1>
          <p>{message}</p>
          <p style={{ marginTop: '0.5rem', color: '#666' }}>
            Ya no recibirás más correos nuestros. Podés volver a suscribirte en cualquier momento desde tu perfil.
          </p>
          <Link to="/" style={{ marginTop: '1.5rem', display: 'inline-block', padding: '0.75rem 2rem', background: '#0a0a0a', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ ...iconStyle, color: '#f44336' }} className="material-symbols-outlined">error</div>
          <h1>Error</h1>
          <p>{message}</p>
          <Link to="/" style={{ marginTop: '1.5rem', display: 'inline-block', padding: '0.75rem 2rem', background: '#0a0a0a', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </>
      )}
    </div>
  );
}
