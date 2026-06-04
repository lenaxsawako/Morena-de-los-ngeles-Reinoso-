import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { landingService } from "./services/landing";

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    landingService.getLandingData().then((data) => {
      if (data.siteName) document.title = data.siteName;
      if (data.logoUrl) {
        let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = data.logoUrl;
      }
    }).catch(() => {});
  }, []);

  return <RouterProvider router={router} />;
}