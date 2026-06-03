import { useEffect, useState } from 'react';
import './notfound.css';

export default function NotFound() {
  const [scrollProgress, setScrollProgress] = useState(0);

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
      const ink = document.querySelector('.notfound-ink-bleed') as HTMLElement;
      if (ink) {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;
        ink.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="notfound-wrapper">
      <div className="notfound-progress" style={{ width: `${scrollProgress}%` }}></div>

      <main className="notfound-main">
        {/* Artistic Background */}
        <div className="notfound-bg-container">
          <div className="notfound-ink-bleed"></div>
          <div className="notfound-texture"></div>
        </div>

        {/* 404 Content */}
        <div className="notfound-content">
          <div className="notfound-content-wrapper">
            <div className="notfound-heading">
              <h1 className="notfound-404">404</h1>
              <h2 className="notfound-title">Perdido en los Márgenes</h2>
            </div>

            <p className="notfound-description">
              La página que buscas se ha perdido en el silencio entre capítulos. Volvamos a la luz.
            </p>

            <div className="notfound-actions">
              <a href="/" className="notfound-button primary">
                Volver al Inicio
              </a>
              <a href="/catalog" className="notfound-button secondary">
                Explorar el Catálogo
              </a>
            </div>
          </div>

          {/* Visual Element */}
          <div className="notfound-illustration">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCz7mkTyU-_YQZgtulkE73AHZpps49oIvKJJCEBckcsbh0H5m8R0MnUQbUTgnzAsyyE9YVmcX-o2uthIA6XDi2rpXjGYUeGiZwb8oFxo2rOwXW2H_H-a4Wq_7--_TAM7lNw06M1xIoUIu61qEDeKfAzcIYF0D_R4u4MN9b5MKMGLC0M1hc_ocvtgFDjCapLySomshGYY-EQ4SQ3kEGTUraeYHT89da0JlnuP0YRc-W29UZxdIZP8FlMme573xDNX-LWLsiGFW17Ow"
              alt="A book lying open"
              className="notfound-book-image"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
