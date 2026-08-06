import AdminLayout from "@/layout/AdminLayout";
import AuthCallback from "@/page/auth/AuthCallback";
import Dashboard from "@/page/dashboard/Dashboard";
import Catalogs from "@/page/landing/catalogs/Catalogs";
import CatalogTemplateSelect from "@/page/landing/catalogs/CatalogTemplateSelect";
import Faq from "@/page/landing/faq/Faq";
import Features from "@/page/landing/features/Features";
import Testimonials from "@/page/landing/testimonials/Testimonials";
import Login from "@/page/login/Login";
import Transactions from "@/page/transactions/Transactions";
import TransactionDetail from "@/page/transactions/TransactionDetail";
import Admins from "@/page/admins/Admins";
import AddAdmin from "@/page/admins/AddAdmin";
import Users from "@/page/users/Users";
import UserDetail from "@/page/users/UserDetail";
import Templates from "@/page/templates/Templates";
import TemplateMaker from "@/page/templates/TemplateMaker";
import AddTemplate from "@/page/templates/AddTemplate"
import EditTemplate from "@/page/templates/EditTemplate";
import TemplateReport from "@/page/templates/TemplateReport";
import TemplateDurations from "@/page/templates/durations/TemplateDurations";
import ContentInvitationTemplates from "@/page/templates/content-invitation-templates/ContentInvitationTemplates";
import { ensureAuthenticated } from "@/lib/auth";
import { createBrowserRouter, Navigate, redirect } from "react-router-dom";

async function requireAuth({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    throw redirect(`/auth/callback${url.search}`);
  }

  const isAuthenticated = await ensureAuthenticated();

  if (!isAuthenticated) {
    throw redirect("/login");
  }

  return null;
}

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "/templates",
    element: <AdminLayout />,
    loader: requireAuth,
    children: [
      {
        index: true,
        element: <Templates />,
        handle: { title: "Templates" },
      },
      {
        path: "add",
        element: <AddTemplate />,
        handle: { title: "Add Template" },
      },
      {
        path: "maker",
        element: <TemplateMaker />,
        handle: { title: "Template Maker" },
      },
      {
        path: "edit",
        element: <EditTemplate />,
        handle: { title: "Edit Template" },
      },
      {
        path: "report",
        element: <TemplateReport />,
        handle: { title: "Template Report" },
      },
      {
        path: "durations",
        element: <TemplateDurations />,
        handle: { title: "Template Durations" },
      },
      {
        path: "content-invitation-templates",
        element: <ContentInvitationTemplates />,
        handle: { title: "Content Invitation Templates" },
      },
    ],
  },
  {
    path: "/",
    element: <AdminLayout />,
    loader: requireAuth,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        handle: { title: "Dashboard" },
      },
      {
        path: "admins",
        element: <Admins />,
        handle: { title: "Admin Management" },
      },
      {
        path: "admins/add",
        element: <AddAdmin />,
        handle: { title: "Add Admin" },
      },
      {
        path: "users",
        element: <Users />,
        handle: { title: "User Management" },
      },
      {
        path: "users/:id",
        element: <UserDetail />,
        handle: { title: "User Detail" },
      },
      {
        path: "transactions",
        element: <Transactions />,
        handle: { title: "Transaction Management" },
      },
      {
        path: "transactions/:id",
        element: <TransactionDetail />,
        handle: { title: "Transaction Detail" },
      },
      {
        path: "landing/faq",
        element: <Faq />,
        handle: { title: "FAQ" },
      },
      {
        path: "landing/dashboard",
        element: <Dashboard />,
        handle: { title: "Dashboard" },
      },
      {
        path: "landing/features",
        element: <Features />,
        handle: { title: "Features" },
      },
      {
        path: "landing/catalogs",
        element: <Catalogs />,
        handle: { title: "Catalog Memoria" },
      },
      {
        path: "landing/catalogs/select",
        element: <CatalogTemplateSelect />,
        handle: { title: "Select Catalog Templates" },
      },
      {
        path: "landing/testimonials",
        element: <Testimonials />,
        handle: { title: "Testimonials" },
      },
    ],
  },
]);
