import { apiClient } from "@/api/http-client";

export type ContentInvitationTemplate = {
  id: number;
  name: string;
  content: string;
  createdAt: string;
};

export type ContentInvitationTemplateFolder = {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ContentInvitationTemplateFolderBrowser = {
  breadcrumbs: Pick<ContentInvitationTemplateFolder, "id" | "name">[];
  folders: ContentInvitationTemplateFolder[];
  contents: ContentInvitationTemplate[];
};

export type ContentInvitationTemplateFolderTree =
  ContentInvitationTemplateFolder & {
    children: ContentInvitationTemplateFolderTree[];
  };

export type CreateContentInvitationTemplatePayload = {
  name: string;
  content: string;
};

export function getContentInvitationTemplateFolderBrowser(
  parentId: number | null,
) {
  return apiClient.get<ContentInvitationTemplateFolderBrowser>(
    "/api/v1/content-invitation-template-folders",
    {
      params: parentId === null ? undefined : { parentId },
    },
  );
}

export function getContentInvitationTemplateFolderTree() {
  return apiClient.get<ContentInvitationTemplateFolderTree[]>(
    "/api/v1/content-invitation-template-folders/tree",
  );
}

export function createContentInvitationTemplate(
  payload: CreateContentInvitationTemplatePayload,
) {
  return apiClient.post<ContentInvitationTemplate>(
    "/api/v1/content-invitation-templates",
    payload,
  );
}

export function deleteContentInvitationTemplate(id: number) {
  return apiClient.delete(`/api/v1/content-invitation-templates/${id}`);
}

export function moveContentInvitationTemplate(
  id: number,
  folderId: number | null,
) {
  return apiClient.patch(`/api/v1/content-invitation-templates/${id}/move`, {
    folderId,
  });
}

export function createContentInvitationTemplateFolder(
  name: string,
  parentId: number | null,
) {
  return apiClient.post<ContentInvitationTemplateFolder>(
    "/api/v1/content-invitation-template-folders",
    { name, parentId },
  );
}

export function updateContentInvitationTemplateFolder(
  id: number,
  name: string,
) {
  return apiClient.patch<ContentInvitationTemplateFolder>(
    `/api/v1/content-invitation-template-folders/${id}`,
    { name },
  );
}

export function moveContentInvitationTemplateFolder(
  id: number,
  folderId: number | null,
) {
  return apiClient.patch(
    `/api/v1/content-invitation-template-folders/${id}/move`,
    { folderId },
  );
}

export function deleteContentInvitationTemplateFolder(id: number) {
  return apiClient.delete(`/api/v1/content-invitation-template-folders/${id}`);
}
