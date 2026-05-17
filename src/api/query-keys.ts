export const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: unknown) => [...queryKeys.users.lists(), params] as const,
    detail: (id: string | number) => [...queryKeys.users.all, "detail", id] as const,
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
};
