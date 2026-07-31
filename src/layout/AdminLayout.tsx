import { Outlet, useMatches, type UIMatch } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";

type RouteHandle = {
  title?: string;
};

const AdminLayout = () => {
  const matches = useMatches() as UIMatch<unknown, RouteHandle>[];

  const currentMatch = matches[matches.length - 1];
  const pageTitle = currentMatch?.handle?.title ?? "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <SiteHeader title={pageTitle} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
