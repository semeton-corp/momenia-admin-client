export const queryKeys = {
  account: {
    all: ["account"] as const,
    me: () => [...queryKeys.account.all, "me"] as const,
  },
  admins: {
    all: ["admins"] as const,
    lists: () => [...queryKeys.admins.all, "list"] as const,
    list: (params?: unknown) => [...queryKeys.admins.lists(), params] as const,
    detail: (id: string | number) => [...queryKeys.admins.all, "detail", id] as const,
  },
  cmsUsers: {
    all: ["cms-users"] as const,
    lists: () => [...queryKeys.cmsUsers.all, "list"] as const,
    list: (params?: unknown) => [...queryKeys.cmsUsers.lists(), params] as const,
    detail: (id: string, params?: unknown) => [...queryKeys.cmsUsers.all, "detail", id, params] as const,
  },
  cmsTransactions: {
    all: ["cms-transactions"] as const,
    lists: () => [...queryKeys.cmsTransactions.all, "list"] as const,
    list: (params?: unknown) => [...queryKeys.cmsTransactions.lists(), params] as const,
    detail: (id: string) => [...queryKeys.cmsTransactions.all, "detail", id] as const,
  },
  cmsDashboard: {
    all: ["cms-dashboard"] as const,
    overview: (period: string) => [...queryKeys.cmsDashboard.all, "overview", period] as const,
    topSellingTemplates: () => [...queryKeys.cmsDashboard.all, "top-selling-templates"] as const,
  },
  faqs: {
    all: ["faqs"] as const,
    lists: () => [...queryKeys.faqs.all, "list"] as const,
  },
  testimonials: {
    all: ["testimonials"] as const,
    lists: () => [...queryKeys.testimonials.all, "list"] as const,
  },
  features: {
    all: ["features"] as const,
    lists: () => [...queryKeys.features.all, "list"] as const,
  },
  invitationTemplates: {
    all: ["invitation-templates"] as const,
    lists: (params?: unknown) => [...queryKeys.invitationTemplates.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.invitationTemplates.all, "detail", id] as const,
  },
  invitationTemplateCategories: {
    all: ["invitation-template-categories"] as const,
    lists: () => [...queryKeys.invitationTemplateCategories.all, "list"] as const,
  },
  invitationTemplateTags: {
    all: ["invitation-template-tags"] as const,
    lists: () => [...queryKeys.invitationTemplateTags.all, "list"] as const,
  },
  landingPageCatalogs: {
    all: ["landing-page-catalogs"] as const,
    lists: () => [...queryKeys.landingPageCatalogs.all, "list"] as const,
  },
  invitationTemplateDurations: {
    all: ["invitation-template-durations"] as const,
    lists: () => [...queryKeys.invitationTemplateDurations.all, "list"] as const,
    detail: (id: string) => [...queryKeys.invitationTemplateDurations.all, "detail", id] as const,
  },
  contentInvitationTemplates: {
    all: ["content-invitation-templates"] as const,
    lists: () => [...queryKeys.contentInvitationTemplates.all, "list"] as const,
  },
};
