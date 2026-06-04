import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import CheckoutLayout from "../layouts/CheckoutLayout";
import ReaderLayout from "../layouts/ReaderLayout";
import AdminLayout from "../pages/Admin";
import ProtectedRoute from "../components/ProtectedRoute";

import Home from "../pages/Home";
import Library from "../pages/Library";
import Catalog from "../pages/Catalog";
import Book from "../pages/Book";
import Chapter from "../pages/Chapter";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import Checkout from "../pages/checkout";
import ConfirmPurchase from "../pages/checkout/confirm";
import TermsOfService from "../pages/ToS";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Profile from "../pages/Profile";
import Favorites from "../pages/Favorites";

import Dashboard from "../pages/Admin/Dashboard";
import ActivityViewAll from "../pages/Admin/Dashboard/ActivityViewAll";
import Manuscripts from "../pages/Admin/Manuscripts";
import EditManuscript from "../pages/Admin/Manuscripts/EditManuscript";
import ManuscriptAnalytics from "../pages/Admin/Manuscripts/ManuscriptAnalytics";
import SalesData from "../pages/Admin/SalesData";
import ReaderInsights from "../pages/Admin/ReaderInsights";
import Settings from "../pages/Admin/Settings";
import NewsletterAdmin from "../pages/Admin/Newsletter";
import AdminReviews from "../pages/Admin/Reviews";

import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/library",
        element: <Library />,
      },
      {
        path: "/catalog",
        element: <Catalog />,
      },
      {
        path: "/book/:id",
        element: <Book />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/terms-of-service",
        element: <TermsOfService />,
      },
      {
        path: "/privacy-policy",
        element: <PrivacyPolicy />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/favorites",
        element: <Favorites />,
      },
    ],
  },
  {
    element: <CheckoutLayout />,
    children: [
      {
        path: "/checkout/:bookId",
        element: <Checkout />,
      },
      {
        path: "/checkout/:bookId/confirm",
        element: <ConfirmPurchase />,
      },
    ],
  },
  {
    element: <ReaderLayout />,
    children: [
      {
        path: "/chapter/:bookId",
        element: <Chapter />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "activity",
        element: <ActivityViewAll />,
      },
      {
        path: "manuscripts",
        element: <Manuscripts />,
      },
      {
        path: "manuscripts/:id",
        element: <EditManuscript />,
      },
      {
        path: "manuscripts/:id/analytics",
        element: <ManuscriptAnalytics />,
      },
      {
        path: "sales",
        element: <SalesData />,
      },
      {
        path: "readers",
        element: <ReaderInsights />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "newsletter",
        element: <NewsletterAdmin />,
      },
      {
        path: "reviews",
        element: <AdminReviews />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
], { basename: '/book' });