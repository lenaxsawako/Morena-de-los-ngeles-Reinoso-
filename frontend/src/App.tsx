import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
// import "@fontsource/inter";
// import "@fontsource/montserrat";

export default function App() {
  useEffect(() => {
    // Activate dark mode by default for LuminaBooks
    document.documentElement.classList.add('dark');
  }, []);

  return <RouterProvider router={router} />;
}