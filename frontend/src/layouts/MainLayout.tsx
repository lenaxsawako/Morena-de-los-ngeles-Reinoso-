import { useEffect } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ScrollToTopOnNav() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === 'PUSH' || navType === 'REPLACE') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
}

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTopOnNav />
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
