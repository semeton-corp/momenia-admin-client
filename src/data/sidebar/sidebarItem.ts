import {
  IconDashboard,
  IconListDetails,
  
} from "@tabler/icons-react";
import { AppWindow, BookUser } from "lucide-react";

export const sidebarItems = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
  ],
  pages: [
    {
      title: "Landing page",
      icon: IconListDetails,
      items: [
        { title: "Banner", url: "/landing/banner" },
        { title: "Features", url: "/landing/features" },
        { title: "Catalog Memoria", url: "/landing/catalog" },
        { title: "Testimonials", url: "/landing/testimonials" },
        { title: "FAQ", url: "/landing/faq" },
      ],
    },
    {
      title: "Templates",
      url: "/templates",
      icon: AppWindow,
    },
    {
      title: "Users",
      url: "/users",
      icon: BookUser,
    },
  ]
};
