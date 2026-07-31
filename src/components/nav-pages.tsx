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
    <SidebarGroup className="px-3 py-3">
      <SidebarGroupLabel>Pages</SidebarGroupLabel>

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
                    <SidebarMenuButton className="h-auto min-h-9 justify-between px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                        <span className="min-w-0 whitespace-normal leading-snug">{item.title}</span>
                      </div>
                      <span>⌄</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="mx-0 ml-4 mt-1 gap-1.5 border-l px-0 py-1 pl-3">
                      {item.items?.map((sub) => {
                        const isSubActive = pathname === sub.url;

                        return (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubActive}
                              className="h-auto min-h-8 whitespace-normal px-3 py-1.5 leading-snug"
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
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.url}>
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton>
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
