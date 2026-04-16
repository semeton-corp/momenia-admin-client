import AdminLayout from "@/layout/AdminLayout";
import Dashboard from "@/page/dashboard/Dashboard";
import Faq from "@/page/landing/faq/Faq";
import Features from "@/page/landing/features/Features";
import Testimonials from "@/page/landing/testimonials/Testimonials";
import Transactions from "@/page/transactions/Transactions";
import Users from "@/page/users/Users";
import { createBrowserRouter, Navigate } from "react-router-dom";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
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
        path: "users",
        element: <Users />,
        handle: { title: "Users" },
      },
      {
        path: "transactions",
        element: <Transactions />,
        handle: { title: "Transactions" },
      },
      {
        path: "landing/faq",
        element: <Faq />,
        handle: { title: "FAQ" },
      },
      {
        path: "landing/features",
        element: <Features />,
        handle: { title: "Features" },
      },
      {
        path: "landing/testimonials",
        element: <Testimonials />,
        handle: { title: "Testimonials" },
      },
    ],
  },
]);
