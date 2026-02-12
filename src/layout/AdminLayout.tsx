import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Settings } from "lucide-react";

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background p-6">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 text-xl font-semibold">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          Memoria Inc.
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavItem
            to="/"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
          />
          <NavItem to="/users" icon={<Users size={18} />} label="Users" />
          <NavItem
            to="/transactions"
            icon={<CreditCard size={18} />}
            label="Transactions"
          />
          <NavItem
            to="/settings"
            icon={<Settings size={18} />}
            label="Settings"
          />
        </nav>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <header className="border-b bg-background p-4 text-lg font-semibold">
          Admin Panel
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
        ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
