"use client";

import type { ElementType } from "react";
import { useLocation, Link } from "react-router-dom";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

type PageItem = {
  title: string;
  url?: string;
  icon?: ElementType<{ className?: string }>;
  items?: {
    title: string;
    url: string;
  }[];
};

export function NavPages({ items }: { items: PageItem[] }) {
  const { pathname } = useLocation();

  return (
    <SidebarGroup className="px-3 pb-4 pt-1">
      <SidebarGroupLabel className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/55">Pages</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Boolean(item.items?.length);
          const isActive = item.url === pathname;

          return (
            <SidebarMenuItem key={item.title}>
              {hasChildren ? (
                <Collapsible
                  defaultOpen={item.items?.some((i) => i.url === pathname)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-auto min-h-10 justify-between px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                        <span className="min-w-0 whitespace-normal leading-snug">{item.title}</span>
                      </div>
                      <span className="text-sidebar-foreground/50">⌄</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-0 ml-4 mt-1 gap-1.5 border-l border-sidebar-border/80 px-0 py-1 pl-3">
                      {item.items?.map((sub) => {
                        const isSubActive = pathname === sub.url;

                        return (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className="h-auto min-h-8 whitespace-normal rounded-lg px-3 py-1.5 leading-snug"
                            >
                              <Link to={sub.url}>{sub.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : item.url ? (
                <SidebarMenuButton asChild isActive={isActive} className="h-auto min-h-10 px-3 py-2.5">
                  <Link to={item.url}>
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton className="h-auto min-h-10 px-3 py-2.5">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
