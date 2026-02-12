import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4">Sidebar</aside>

      <main className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
