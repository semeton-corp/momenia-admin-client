import AdminLayout from "@/layout/AdminLayout";
import Dashboard from "@/page/dashboard/Dashboard";
import Transactions from "@/page/transactions/Transactions";
import Users from "@/page/users/Users";
import { createBrowserRouter } from "react-router-dom";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "transactions",
        element: <Transactions />,
      },
    ],
  },
]);
