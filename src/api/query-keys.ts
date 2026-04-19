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
  features:{
    all: ["features"] as const,
    lists: () => [...queryKeys.features.all, "list"] as const
  }
};
