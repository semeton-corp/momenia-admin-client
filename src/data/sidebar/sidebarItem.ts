import { IconDashboard, IconListDetails } from "@tabler/icons-react";
import { AppWindow, BookUser } from "lucide-react";

export const sidebarItems = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
  ],
  pages: [
    {
      title: "Landing Page Management",
      icon: IconListDetails,
      items: [
        { title: "Features", url: "/landing/features" },
        { title: "Catalog Recommendations", url: "/landing/catalogs" },
        { title: "Testimonials", url: "/landing/testimonials" },
        { title: "FAQs", url: "/landing/faq" },
      ],
    },
    {
      title: "Templates Management",
      icon: AppWindow,
      items: [
        { title: "Overview", url: "/templates/report" },
        { title: "Templates", url: "/templates" },
        { title: "Durations", url: "/templates/durations" },
      ],
    },
    {
      title: "Admin Management",
      url: "/admins",
      icon: BookUser,
    },
  ],
};
