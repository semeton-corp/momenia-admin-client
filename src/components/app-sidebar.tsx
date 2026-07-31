import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarItems } from "@/data/sidebar/sidebarItem";
import { NavPages } from "./nav-pages";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto rounded-lg border border-sidebar-border/80 bg-sidebar-accent/70 shadow-none data-[slot=sidebar-menu-button]:!p-3 dark:bg-[#0d1628]"
              variant="outline"
            >
              <a href="#" className="flex items-center gap-3">
                <svg
                  width="38"
                  height="51"
                  viewBox="0 0 38 51"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-11 w-auto shrink-0"
                  aria-hidden="true"
                >
                  <path d="M21.861 40.217c-1.975 2.567-3.703 5.112-5.442 6.088-1.423.798-2.477 1.642-4.02 1.11-1.541-.53-3.409-2.929-4.244-5.02-.835-2.093-1.506-4.09-1.809-6.835-.224-2.03 0-5.23 0-5.23s-3.671-2.428-5.01-4.883C-.297 22.452-.18 19.171.362 16.87c.904-3.836 3.108-5.942 2.783-9.973C2.821 2.865.71 1.386.92.55c.236-.948 10.94-1.604 19.483 6.346 4.87 4.533 7.376 8.738 9.463 15.413 1.461 4.672 2.42 9.237 1.681 10.436-.738 1.2-6.019 2.708-9.685 7.472" fill="url(#momenia-logo-a)" />
                  <path d="M21.1 41.947c-2.438 3.158-4.895 6.608-7.041 7.809-1.756.982-3.593.997-5.496.343-1.902-.654-4.207-3.604-5.237-6.178-1.03-2.575-1.859-5.033-2.233-8.41-.276-2.498-.531-3.98 0-6.436.724-3.343 1.8-5.267 4.239-7.667 7.944-7.82 27.278 9.255 26.218 11.297s-5.927 3.38-10.45 9.242" fill="url(#momenia-logo-b)" />
                  <path d="M33.053 21.89c.132-.16 1.406 1.678 2.092 3.108a9.7 9.7 0 0 1 .921 3.229c.273 2.55-.352 3.39-.368 3.412.016-.01.465-.287.646-.83.358-1.076.222-1.712.369-1.777.148-.063.737 1.593.368 2.884s-.873 2.165-1.752 3.044a25 25 0 0 1-2.04 1.845s2.04-.831 2.501-1.292c.46-.46-.042 1.2-2.767 2.49-1.456.69-2.122.739-3.966 1.846s-3.597 2.951-4.704 5.165-2.231 5.08-2.508 5.08c-.276-.002.24-3.515 1.014-5.625s2.231-4.398 3.984-5.728c2.674-2.029 5.617-3.733 6.549-5.441 1.106-2.03 1.107-2.944 1.107-4.268 0-1.082-.169-2.255-.462-3.573-.369-1.66-1.117-3.407-.984-3.568M22.877 46.306a.37.37 0 1 0 0 .738.37.37 0 0 0 0-.738" fill="url(#momenia-logo-c)" />
                  <defs>
                    <linearGradient id="momenia-logo-a" x1="10.444" y1="22.44" x2="21.136" y2="5.202" gradientUnits="userSpaceOnUse"><stop stopColor="#d0cef8" /><stop offset="1" stopColor="#ecebfd" /></linearGradient>
                    <linearGradient id="momenia-logo-b" x1="32.654" y1="33.668" x2="7.841" y2="23.522" gradientUnits="userSpaceOnUse"><stop stopColor="#4f46e5" /><stop offset="1" stopColor="#abb1ff" /></linearGradient>
                    <linearGradient id="momenia-logo-c" x1="34.591" y1="21.954" x2="34.231" y2="50.337" gradientUnits="userSpaceOnUse"><stop offset=".084" stopColor="#dcdafa" /><stop offset=".401" stopColor="#abb1ff" /><stop offset="1" stopColor="#4f46e5" /></linearGradient>
                  </defs>
                </svg>
                <span className="grid text-left leading-tight">
                  <span className="text-sm font-bold tracking-[-0.02em]">Momenia CMS</span>
                  <span className="text-xs text-muted-foreground">Semeton Corp</span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems.navMain} />
        <NavPages items={sidebarItems.pages} />
        {/* <NavSecondary items={sidebarItems.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
