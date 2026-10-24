import { useEffect, useMemo, useState } from "react";
import { Button, Badge, Modal, Label, TextInput, Select, Alert, ModalFooter, ModalBody, ModalHeader } from "flowbite-react";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArchive, HiOutlineRefresh } from "react-icons/hi";
import PageMeta from "../../common/PageMeta";
import ConfirmModal from "../../common/ConfirmModal";
import FieldError from "../../common/FieldError";
import type { Category, CategoryType } from "../../services/categoriesService";
import {
  useArchiveCategory,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useRestoreCategory,
  useUpdateCategory,
} from "../../hooks/useCategories";

type CategoryNode = Category & { children: Category[] };

interface RowActions {
  busy: boolean;
  onEdit: (c: Category) => void;
  onArchive: (c: Category) => void;
  onRestore: (c: Category) => void;
  onDelete: (c: Category) => void;
}

function ActionButtons({ category, busy, onEdit, onArchive, onRestore, onDelete }: RowActions & { category: Category }) {
  if (category.userId === null) return null;
  return (
    <div className="ml-1 flex gap-1">
      <button
        onClick={() => onEdit(category)}
        className="text-gray-400 hover:text-brand-500"
        aria-label="Edit category"
      >
        <HiOutlinePencil className="size-4" />
      </button>
      {category.status === "ACTIVE" ? (
        <button
          onClick={() => onArchive(category)}
          disabled={busy}
          className="text-gray-400 hover:text-amber-500 disabled:opacity-50"
          aria-label="Archive category"
        >
          <HiOutlineArchive className="size-4" />
        </button>
      ) : (
        <button
          onClick={() => onRestore(category)}
          disabled={busy}
          className="text-gray-400 hover:text-brand-500 disabled:opacity-50"
          aria-label="Restore category"
        >
          <HiOutlineRefresh className="size-4" />
        </button>
      )}
      <button
        onClick={() => onDelete(category)}
        className="text-gray-400 hover:text-red-500"
        aria-label="Delete category"
      >
        <HiOutlineTrash className="size-4" />
      </button>
    </div>
  );
}

function CategoryCard({
  node,
  parentName,
  onAddSub,
  ...actions
}: RowActions & { node: CategoryNode; parentName?: string; onAddSub: (c: Category) => void }) {
  const isSystem = node.userId === null;
  return (
    <div className="flex min-w-56 flex-col gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {parentName && <span className="font-normal text-gray-400">{parentName} › </span>}
          {node.name}
        </span>
        {isSystem && <Badge color="gray">System</Badge>}
        {node.status === "ARCHIVED" && <Badge color="warning">Archived</Badge>}
        <div className="ml-auto flex items-center gap-1">
          {node.status === "ACTIVE" && !node.parentId && (
            <button
              onClick={() => onAddSub(node)}
              className="text-gray-400 hover:text-brand-500"
              aria-label={`Add subcategory to ${node.name}`}
              title="Add subcategory"
            >
              <HiOutlinePlus className="size-4" />
            </button>
          )}
          <ActionButtons category={node} {...actions} />
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col gap-1 border-l-2 border-gray-100 pl-3 dark:border-gray-800">
          {node.children.map((child) => (
            <div key={child.id} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{child.name}</span>
              {child.userId === null && <Badge color="gray">System</Badge>}
              {child.status === "ARCHIVED" && <Badge color="warning">Archived</Badge>}
              <div className="ml-auto">
                <ActionButtons category={child} {...actions} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [status, setStatus] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [actionError, setActionError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createParent, setCreateParent] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data, isPending, isError, refetch } = useCategories({ status: "ALL" });
  const archiveCategory = useArchiveCategory();
  const restoreCategory = useRestoreCategory();
  const deleteCategory = useDeleteCategory();
  const busy = archiveCategory.isPending || restoreCategory.isPending;

  const byId = useMemo(() => new Map((data ?? []).map((c) => [c.id, c])), [data]);

  const filtered = useMemo(
    () => (data ?? []).filter((c) => c.type === type && (status === "ALL" || c.status === status)),
    [data, type, status],
  );

  const { systemRoots, customRoots, hasCustom } = useMemo(() => {
    const visibleIds = new Set(filtered.map((c) => c.id));
    const childrenOf = new Map<string, Category[]>();
    const roots: Category[] = [];

    for (const c of filtered) {
      if (c.parentId && visibleIds.has(c.parentId)) {
        childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c]);
      } else {
        roots.push(c);
      }
    }

    const nodes: CategoryNode[] = roots.map((r) => ({ ...r, children: childrenOf.get(r.id) ?? [] }));
    return {
      systemRoots: nodes.filter((n) => n.userId === null),
      customRoots: nodes.filter((n) => n.userId !== null),
      hasCustom: filtered.some((c) => c.userId !== null),
    };
  }, [filtered]);

  function errorMessage(err: any, fallback: string) {
    return err?.response?.data?.message ?? fallback;
  }

  async function handleArchive(cat: Category) {
    setActionError(null);
    try {
      await archiveCategory.mutateAsync(cat.id);
    } catch (err) {
      setActionError(errorMessage(err, "Could not archive this category."));
    }
  }

  async function handleRestore(cat: Category) {
    setActionError(null);
    try {
      await restoreCategory.mutateAsync(cat.id);
    } catch (err) {
      setActionError(errorMessage(err, "Could not restore this category."));
    }
  }

  function openCreate(parent: Category | null) {
    setCreateParent(parent);
    setCreateOpen(true);
  }

  const rowActions: RowActions = {
    busy,
    onEdit: setEditTarget,
    onArchive: handleArchive,
    onRestore: handleRestore,
    onDelete: setDeleteTarget,
  };

  function renderCard(node: CategoryNode) {
    const parentName = node.parentId ? byId.get(node.parentId)?.name : undefined;
    return (
      <CategoryCard
        key={node.id}
        node={node}
        parentName={parentName}
        onAddSub={openCreate}
        {...rowActions}
      />
    );
  }

  return (
    <>
      <PageMeta title="Categories | Money Manager" description="Manage income and expense categories" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Categories</h1>
          <div className="flex gap-2">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "ARCHIVED" | "ALL")}
              className="w-36"
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </Select>
            <Button size="sm" onClick={() => openCreate(null)}>
              <HiOutlinePlus className="mr-2 size-4" />
              New category
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                type === t
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {isError && (
          <Alert color="failure">
            Could not load categories.{" "}
            <button type="button" onClick={() => refetch()} className="font-medium underline">
              Try again
            </button>
          </Alert>
        )}
        {actionError && (
          <Alert color="failure" onDismiss={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}
        {isPending && <p className="text-sm text-gray-500">Loading...</p>}

        {!isPending && !isError && (
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">System categories</h2>
              <div className="flex flex-wrap items-start gap-2">
                {systemRoots.map(renderCard)}
                {systemRoots.length === 0 && <p className="text-sm text-gray-400">No system categories.</p>}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">My categories</h2>
              {!hasCustom ? (
                <p className="text-sm text-gray-400">
                  You haven't created any custom {type.toLowerCase()} categories yet.
                </p>
              ) : (
                <div className="flex flex-wrap items-start gap-2">{customRoots.map(renderCard)}</div>
              )}
            </section>
          </div>
        )}
      </div>

      <CreateCategoryModal
        show={createOpen}
        defaultType={type}
        parent={createParent}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />

      <EditCategoryModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => setEditTarget(null)}
      />

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete category"
        message={
          <>
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setActionError(null);
          try {
            await deleteCategory.mutateAsync(deleteTarget.id);
          } catch (err) {
            setActionError(errorMessage(err, "This category is in use. Archive it instead of deleting it."));
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}

//Create
function CreateCategoryModal({
  show,
  defaultType,
  parent,
  onClose,
  onCreated,
}: {
  show: boolean;
  defaultType: CategoryType;
  parent: Category | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createCategory = useCreateCategory();
  const loading = createCategory.isPending;

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setType(defaultType);
      setName("");
      setNameError(undefined);
      setError(null);
    }
  }, [show, defaultType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setNameError("Category name is required.");
      return;
    }

    try {
      await createCategory.mutateAsync(
        parent ? { name: name.trim(), parentId: parent.id } : { name: name.trim(), type },
      );
      onCreated();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setNameError(
          parent
            ? "This subcategory already exists under this category."
            : "You already have a category with this name and type.",
        );
      } else {
        setError(err?.response?.data?.message ?? "Could not create category.");
      }
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="sm">
      <ModalHeader>{parent ? `New subcategory of ${parent.name}` : "New category"}</ModalHeader>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-4">
            {error && <Alert color="failure">{error}</Alert>}
            <div>
              <Label htmlFor="category-name">
                Name <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="category-name"
                value={name}
                color={nameError ? "failure" : "gray"}
                aria-invalid={!!nameError}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(undefined);
                }}
                placeholder={parent ? "e.g. Fuel" : "e.g. Pet care"}
              />
              <FieldError message={nameError} />
            </div>
            {parent ? (
              <p className="text-xs text-gray-400">
                It will be an {parent.type === "INCOME" ? "income" : "expense"} subcategory, like its parent.
              </p>
            ) : (
              <div>
                <Label htmlFor="category-type">Type</Label>
                <Select id="category-type" value={type} onChange={(e) => setType(e.target.value as CategoryType)}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </Select>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

//Edit
function EditCategoryModal({
  target,
  onClose,
  onSaved,
}: {
  target: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateCategory = useUpdateCategory();
  const loading = updateCategory.isPending;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setName(target.name);
      setNameError(undefined);
      setError(null);
    }
  }, [target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setError(null);

    if (!name.trim()) {
      setNameError("Category name is required.");
      return;
    }

    try {
      await updateCategory.mutateAsync({ id: target.id, name: name.trim() });
      onSaved();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setNameError("A category with this name already exists here.");
      } else {
        setError(err?.response?.data?.message ?? "Could not update category.");
      }
    }
  }

  return (
    <Modal show={!!target} onClose={onClose} size="sm">
      <ModalHeader>Edit category</ModalHeader>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-4">
            {error && <Alert color="failure">{error}</Alert>}
            <div>
              <Label htmlFor="edit-category-name">
                Name <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="edit-category-name"
                value={name}
                color={nameError ? "failure" : "gray"}
                aria-invalid={!!nameError}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(undefined);
                }}
              />
              <FieldError message={nameError} />
            </div>
            <p className="text-xs text-gray-400">The type (income/expense) cannot be changed after creation.</p>
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}