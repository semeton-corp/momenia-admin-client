import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createContentInvitationTemplate,
  createContentInvitationTemplateFolder,
  deleteContentInvitationTemplate,
  deleteContentInvitationTemplateFolder,
  getContentInvitationTemplateFolderBrowser,
  getContentInvitationTemplateFolderTree,
  moveContentInvitationTemplate,
  moveContentInvitationTemplateFolder,
  updateContentInvitationTemplateFolder,
  type ContentInvitationTemplate,
  type ContentInvitationTemplateFolder,
  type ContentInvitationTemplateFolderTree,
} from "@/api/cms/content-invitation-templates";
import { uploadObjectWithPresignedUrl } from "@/api/objects";
import { queryKeys } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { compressImage } from "@/utils/compressImage";
import { formatApiDate } from "@/utils/formatApiDate";

const MAX_IMAGE_BYTES = 1024 * 1024;

type CreatePayload = {
  name: string;
  file: File;
  folderId: number | null;
};

function formatBytes(bytes: number) {
  return bytes >= MAX_IMAGE_BYTES
    ? `${(bytes / MAX_IMAGE_BYTES).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getDescendantIds(
  folder: ContentInvitationTemplateFolderTree,
): Set<number> {
  return new Set([
    folder.id,
    ...folder.children.flatMap((child) => [...getDescendantIds(child)]),
  ]);
}

export default function ContentInvitationTemplates() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [folderTarget, setFolderTarget] =
    useState<ContentInvitationTemplateFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderFormError, setFolderFormError] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [deleteTemplateTarget, setDeleteTemplateTarget] =
    useState<ContentInvitationTemplate | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<ContentInvitationTemplateFolder | null>(null);
  const [moveTemplateTarget, setMoveTemplateTarget] =
    useState<ContentInvitationTemplate | null>(null);
  const [moveFolderTarget, setMoveFolderTarget] =
    useState<ContentInvitationTemplateFolder | null>(null);
  const [moveDestinationId, setMoveDestinationId] = useState<number | null>(
    null,
  );

  const browserQuery = useQuery({
    queryKey: queryKeys.contentInvitationTemplates.lists(activeFolderId),
    queryFn: () => getContentInvitationTemplateFolderBrowser(activeFolderId),
  });
  const treeQuery = useQuery({
    queryKey: queryKeys.contentInvitationTemplates.folderTree(),
    queryFn: getContentInvitationTemplateFolderTree,
    enabled: moveTemplateTarget !== null || moveFolderTarget !== null,
  });

  const invalidateLibrary = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.contentInvitationTemplates.all,
    });
  const browser = browserQuery.data ?? {
    breadcrumbs: [],
    folders: [],
    contents: [],
  };
  const excludedFolderIds = useMemo(() => {
    const movingTreeNode = moveFolderTarget
      ? findTreeNode(treeQuery.data ?? [], moveFolderTarget.id)
      : undefined;
    return movingTreeNode
      ? getDescendantIds(movingTreeNode)
      : new Set<number>();
  }, [moveFolderTarget, treeQuery.data]);

  const resetCreateForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setName("");
    setFile(null);
    setPreviewUrl("");
    setFormError("");
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const closeFolderForm = () => {
    setIsFolderFormOpen(false);
    setFolderTarget(null);
    setFolderName("");
    setFolderFormError("");
  };

  const createMutation = useMutation({
    mutationFn: async ({
      name: templateName,
      file: imageFile,
      folderId,
    }: CreatePayload) => {
      const uploaded = await uploadObjectWithPresignedUrl(
        imageFile,
        "content-invitation-template",
      );
      await createContentInvitationTemplate({
        name: templateName,
        content: uploaded.key,
        folderId,
      });
    },
    onSuccess: async () => {
      toast.success("Content template created");
      await invalidateLibrary();
      closeCreate();
    },
    onError: (error) => {
      const message = getErrorMessage(
        error,
        "Failed to create content template",
      );
      setFormError(message);
      toast.error(message);
    },
  });

  const folderMutation = useMutation({
    mutationFn: ({
      id,
      folderName: nextName,
    }: {
      id: number | null;
      folderName: string;
    }) =>
      id === null
        ? createContentInvitationTemplateFolder(nextName, activeFolderId)
        : updateContentInvitationTemplateFolder(id, nextName),
    onSuccess: async () => {
      toast.success(folderTarget ? "Folder renamed" : "Folder created");
      await invalidateLibrary();
      closeFolderForm();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to save folder");
      setFolderFormError(message);
      toast.error(message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deleteContentInvitationTemplate,
    onSuccess: async () => {
      toast.success("Content template deleted");
      await invalidateLibrary();
      setDeleteTemplateTarget(null);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to delete content template")),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteContentInvitationTemplateFolder,
    onSuccess: async () => {
      toast.success("Folder deleted");
      await invalidateLibrary();
      setDeleteFolderTarget(null);
    },
    onError: (error) =>
      toast.error(
        getErrorMessage(error, "Folder must be empty before it can be deleted"),
      ),
  });

  const moveTemplateMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: number; folderId: number | null }) =>
      moveContentInvitationTemplate(id, folderId),
    onSuccess: async () => {
      toast.success("Content template moved");
      await invalidateLibrary();
      setMoveTemplateTarget(null);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to move content template")),
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: number; folderId: number | null }) =>
      moveContentInvitationTemplateFolder(id, folderId),
    onSuccess: async () => {
      toast.success("Folder moved");
      await invalidateLibrary();
      setMoveFolderTarget(null);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to move folder")),
  });

  const handleFileSelect = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setFormError("Please choose a PNG, JPG, or WEBP image");
      return;
    }

    setFormError("");
    let finalFile = selectedFile;
    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setIsCompressing(true);
      try {
        finalFile = await compressImage(selectedFile, {
          maxWidth: 4096,
          maxHeight: 4096,
          targetSizeBytes: MAX_IMAGE_BYTES,
        });
      } catch {
        setFormError("Could not compress this image. Please try another file.");
        return;
      } finally {
        setIsCompressing(false);
      }
      if (finalFile.size > MAX_IMAGE_BYTES) {
        setFormError(
          `Image is still ${formatBytes(finalFile.size)} after compression. Please use a smaller image.`,
        );
        return;
      }
      toast.success(
        `Image compressed from ${formatBytes(selectedFile.size)} to ${formatBytes(finalFile.size)}`,
      );
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(finalFile);
    setPreviewUrl(URL.createObjectURL(finalFile));
  };

  const isBusy = createMutation.isPending || isCompressing;
  const isEmpty = browser.folders.length === 0 && browser.contents.length === 0;

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Asset library
            </p>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              Content Invitation Templates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize reusable invitation images, then copy their public URLs.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderFormOpen(true)}
            >
              <FolderPlus className="size-4" />
              New folder
            </Button>
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              Add content template
            </Button>
          </div>
        </div>

        <nav
          aria-label="Folder path"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-sm"
        >
          <button
            type="button"
            onClick={() => setActiveFolderId(null)}
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="size-3.5" aria-hidden="true" />
            Home
          </button>
          {browser.breadcrumbs.map((breadcrumb) => (
            <span key={breadcrumb.id} className="flex items-center gap-1.5">
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setActiveFolderId(breadcrumb.id)}
                className="rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {breadcrumb.name}
              </button>
            </span>
          ))}
        </nav>

        {browserQuery.isLoading && <LibrarySkeleton />}
        {browserQuery.isError && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load this folder.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => browserQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}
        {!browserQuery.isLoading && !browserQuery.isError && isEmpty && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImagePlus className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              This folder is empty.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a folder or upload the first image.
            </p>
          </div>
        )}
        {!browserQuery.isLoading && !browserQuery.isError && !isEmpty && (
          <div className="space-y-8">
            {browser.folders.length > 0 && (
              <section aria-labelledby="folders-heading">
                <h2
                  id="folders-heading"
                  className="mb-3 text-sm font-semibold text-foreground"
                >
                  Folders
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {browser.folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onOpen={() => setActiveFolderId(folder.id)}
                      onRename={() => {
                        setFolderTarget(folder);
                        setFolderName(folder.name);
                        setFolderFormError("");
                        setIsFolderFormOpen(true);
                      }}
                      onMove={() => {
                        setMoveFolderTarget(folder);
                        setMoveDestinationId(folder.parentId);
                      }}
                      onDelete={() => setDeleteFolderTarget(folder)}
                    />
                  ))}
                </div>
              </section>
            )}
            {browser.contents.length > 0 && (
              <section aria-labelledby="content-heading">
                <h2
                  id="content-heading"
                  className="mb-3 text-sm font-semibold text-foreground"
                >
                  Content
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {browser.contents.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onCopy={() => void copyUrl(template.content)}
                      onMove={() => {
                        setMoveTemplateTarget(template);
                        setMoveDestinationId(activeFolderId);
                      }}
                      onDelete={() => setDeleteTemplateTarget(template)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <DialogFrame
          title="Add content template"
          description="Upload one image to the current folder."
          onClose={closeCreate}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim())
                return setFormError("Template name is required");
              if (!file) return setFormError("Image file is required");
              setFormError("");
              createMutation.mutate({
                name: name.trim(),
                file,
                folderId: activeFolderId,
              });
            }}
            className="space-y-5"
          >
            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="content-template-name">Name</Label>
              <Input
                id="content-template-name"
                value={name}
                placeholder="e.g. Alya holding a book"
                onChange={(event) => {
                  setName(event.target.value);
                  setFormError("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event: DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  if (!isBusy) {
                    event.dataTransfer.dropEffect = "copy";
                    setIsDragging(true);
                  }
                }}
                onDragLeave={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  )
                    setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  if (!isBusy)
                    void handleFileSelect(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background transition-colors hover:border-muted-foreground/50",
                  isDragging && "border-primary bg-primary/10",
                  isBusy && "cursor-not-allowed opacity-70",
                )}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected content template"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-3 px-6 text-center">
                    <Upload className="size-9 text-muted-foreground/50" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {isDragging
                          ? "Drop image here"
                          : "Drag & drop or choose image file"}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        PNG, JPG, or WEBP · images over 1 MB are compressed
                        automatically
                      </span>
                    </span>
                  </span>
                )}
                {isBusy && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleFileSelect(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={createMutation.isPending}
                onClick={closeCreate}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isBusy}>
                {createMutation.isPending ? "Saving..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogFrame>
      )}

      {isFolderFormOpen && (
        <DialogFrame
          title={folderTarget ? "Rename folder" : "New folder"}
          description={
            folderTarget
              ? "Choose a clear, recognizable name."
              : "The folder will be created here."
          }
          onClose={closeFolderForm}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const nextName = folderName.trim();
              if (!nextName)
                return setFolderFormError("Folder name is required");
              setFolderFormError("");
              folderMutation.mutate({
                id: folderTarget?.id ?? null,
                folderName: nextName,
              });
            }}
            className="space-y-5"
          >
            {folderFormError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
              >
                {folderFormError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                autoFocus
                value={folderName}
                placeholder="e.g. Couple portraits"
                onChange={(event) => {
                  setFolderName(event.target.value);
                  setFolderFormError("");
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={folderMutation.isPending}
                onClick={closeFolderForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={folderMutation.isPending}
              >
                {folderMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogFrame>
      )}

      {moveTemplateTarget && (
        <MoveDialog
          title="Move content template"
          name={moveTemplateTarget.name}
          tree={treeQuery.data ?? []}
          excludedIds={excludedFolderIds}
          value={moveDestinationId}
          loading={treeQuery.isLoading || moveTemplateMutation.isPending}
          error={treeQuery.isError}
          onChange={setMoveDestinationId}
          onClose={() => setMoveTemplateTarget(null)}
          onConfirm={() =>
            moveTemplateMutation.mutate({
              id: moveTemplateTarget.id,
              folderId: moveDestinationId,
            })
          }
        />
      )}
      {moveFolderTarget && (
        <MoveDialog
          title="Move folder"
          name={moveFolderTarget.name}
          tree={treeQuery.data ?? []}
          excludedIds={excludedFolderIds}
          value={moveDestinationId}
          loading={treeQuery.isLoading || moveFolderMutation.isPending}
          error={treeQuery.isError}
          onChange={setMoveDestinationId}
          onClose={() => setMoveFolderTarget(null)}
          onConfirm={() =>
            moveFolderMutation.mutate({
              id: moveFolderTarget.id,
              folderId: moveDestinationId,
            })
          }
        />
      )}
      {deleteTemplateTarget && (
        <ConfirmDialog
          title="Delete content template"
          description={`Delete “${deleteTemplateTarget.name}”? This does not remove the original uploaded file.`}
          action="Delete"
          pending={deleteTemplateMutation.isPending}
          onClose={() => setDeleteTemplateTarget(null)}
          onConfirm={() =>
            deleteTemplateMutation.mutate(deleteTemplateTarget.id)
          }
        />
      )}
      {deleteFolderTarget && (
        <ConfirmDialog
          title="Delete folder"
          description={`Delete “${deleteFolderTarget.name}”? Folders must be empty before they can be deleted.`}
          action="Delete"
          pending={deleteFolderMutation.isPending}
          onClose={() => setDeleteFolderTarget(null)}
          onConfirm={() => deleteFolderMutation.mutate(deleteFolderTarget.id)}
        />
      )}
    </main>
  );
}

function findTreeNode(
  nodes: ContentInvitationTemplateFolderTree[],
  id: number,
): ContentInvitationTemplateFolderTree | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findTreeNode(node.children, id);
    if (child) return child;
  }
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("URL copied");
  } catch {
    toast.error("Could not copy URL");
  }
}

function FolderCard({
  folder,
  onOpen,
  onRename,
  onMove,
  onDelete,
}: {
  folder: ContentInvitationTemplateFolder;
  onOpen: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-muted-foreground/40">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FolderOpen className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {folder.name}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Open folder
          </span>
        </span>
      </button>
      <div className="flex shrink-0 gap-1">
        <IconButton label={`Rename ${folder.name}`} onClick={onRename}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton label={`Move ${folder.name}`} onClick={onMove}>
          <ArrowRightLeft className="size-4" />
        </IconButton>
        <IconButton
          label={`Delete ${folder.name}`}
          onClick={onDelete}
          destructive
        >
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </article>
  );
}

function TemplateCard({
  template,
  onCopy,
  onMove,
  onDelete,
}: {
  template: ContentInvitationTemplate;
  onCopy: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-muted-foreground/40">
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={template.content}
          alt={template.name}
          className="h-full w-full object-contain"
          loading="lazy"
        />
        <div className="absolute right-3 top-3 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <IconButton
            label={`Copy URL for ${template.name}`}
            onClick={onCopy}
            floating
          >
            <Copy className="size-4" />
          </IconButton>
          <IconButton label={`Move ${template.name}`} onClick={onMove} floating>
            <ArrowRightLeft className="size-4" />
          </IconButton>
          <IconButton
            label={`Delete ${template.name}`}
            onClick={onDelete}
            destructive
            floating
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <h3
            className="truncate text-sm font-semibold text-foreground"
            title={template.name}
          >
            {template.name}
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {formatApiDate(template.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          title={template.content}
        >
          <span className="min-w-0 flex-1 truncate">{template.content}</span>
          <Copy className="size-3 shrink-0" />
        </button>
      </div>
    </article>
  );
}

function IconButton({
  label,
  onClick,
  destructive = false,
  floating = false,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  floating?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={destructive ? "destructive" : floating ? "secondary" : "ghost"}
      className={cn(
        floating &&
          "bg-background text-foreground shadow-sm hover:bg-background",
      )}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function DialogFrame({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label={`Close ${title} dialog`}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            <p
              id="dialog-description"
              className="mt-1 text-sm text-muted-foreground"
            >
              {description}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

function MoveDialog({
  title,
  name,
  tree,
  excludedIds,
  value,
  loading,
  error,
  onChange,
  onClose,
  onConfirm,
}: {
  title: string;
  name: string;
  tree: ContentInvitationTemplateFolderTree[];
  excludedIds: Set<number>;
  value: number | null;
  loading: boolean;
  error: boolean;
  onChange: (value: number | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  return (
    <DialogFrame
      title={title}
      description={`Choose where “${name}” belongs.`}
      onClose={onClose}
    >
      <div className="space-y-5">
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            Folders could not be loaded. You can still move this item to Root.
          </p>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Destination</p>
          <div
            role="tree"
            aria-label="Choose destination folder"
            className="max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-1.5"
          >
            <button
              type="button"
              role="treeitem"
              aria-pressed={value === null}
              onClick={() => onChange(null)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value === null
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Home className="size-4" />
              Home
            </button>
            <DestinationTree
              nodes={tree}
              excludedIds={excludedIds}
              selectedId={value}
              expandedIds={expandedIds}
              onSelect={onChange}
              onExpandedChange={setExpandedIds}
            />
            {tree.length === 0 && !loading && !error && (
              <p className="px-2.5 py-2 text-sm text-muted-foreground">
                No folders yet.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Moving..." : "Move"}
          </Button>
        </div>
      </div>
    </DialogFrame>
  );
}

function DestinationTree({
  nodes,
  excludedIds,
  selectedId,
  expandedIds,
  onSelect,
  onExpandedChange,
}: {
  nodes: ContentInvitationTemplateFolderTree[];
  excludedIds: Set<number>;
  selectedId: number | null;
  expandedIds: Set<number>;
  onSelect: (id: number) => void;
  onExpandedChange: (ids: Set<number>) => void;
}) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => {
        if (excludedIds.has(node.id)) return null;

        const children = node.children.filter(
          (child) => !excludedIds.has(child.id),
        );
        const isExpanded = expandedIds.has(node.id);

        return (
          <Collapsible
            key={node.id}
            open={isExpanded}
            onOpenChange={(open) => {
              const nextIds = new Set(expandedIds);
              if (open) nextIds.add(node.id);
              else nextIds.delete(node.id);
              onExpandedChange(nextIds);
            }}
          >
            <div className="flex items-center gap-0.5">
              {children.length > 0 ? (
                <CollapsibleTrigger
                  type="button"
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </CollapsibleTrigger>
              ) : (
                <span className="size-8 shrink-0" aria-hidden="true" />
              )}
              <button
                type="button"
                role="treeitem"
                aria-pressed={selectedId === node.id}
                onClick={() => onSelect(node.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedId === node.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {isExpanded ? (
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Folder className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{node.name}</span>
              </button>
            </div>
            {children.length > 0 && (
              <CollapsibleContent>
                <div className="ml-4 border-l border-border pl-2">
                  <DestinationTree
                    nodes={children}
                    excludedIds={excludedIds}
                    selectedId={selectedId}
                    expandedIds={expandedIds}
                    onSelect={onSelect}
                    onExpandedChange={onExpandedChange}
                  />
                </div>
              </CollapsibleContent>
            )}
          </Collapsible>
        );
      })}
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  action,
  pending,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  action: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogFrame title={title} description={description} onClose={onClose}>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="flex-1"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Deleting..." : action}
        </Button>
      </div>
    </DialogFrame>
  );
}

function LibrarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content library"
      className="space-y-8"
    >
      <div>
        <div className="mb-3 h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
