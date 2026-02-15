import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar className="pr-3" />
      <SidebarInset className="bg-secondary mx-3 mt-3 rounded-lg ">
        <SiteHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
