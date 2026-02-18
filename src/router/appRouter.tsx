import AdminLayout from "@/layout/AdminLayout";
import Dashboard from "@/page/dashboard/Dashboard";
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
    ],
  },
]);
