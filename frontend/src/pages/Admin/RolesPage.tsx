import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "flowbite-react";
import {
  HiOutlineCog6Tooth,
  HiOutlineLockClosed,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineUsers,
} from "react-icons/hi2";
import PageMeta from "../../common/PageMeta";
import ConfirmModal from "../../common/ConfirmModal";
import FieldError from "../../common/FieldError";
import type { PermissionView, RoleView } from "../../services/rolesService";
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useSetRolePermissions,
} from "../../hooks/useAdminRoles";

const NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;

const ACCENTS = [
  "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
];

const GROUP_TITLES: Record<string, string> = {
  users: "Users",
  roles: "Roles and permissions",
  audit: "Audit logs",
};

function accentFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return ACCENTS[h % ACCENTS.length];
}

function prettyName(name: string) {
  return name
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function groupTitle(key: string) {
  return GROUP_TITLES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export default function AdminRolesPage() {
  const rolesQuery = useRoles();
  const permissionsQuery = usePermissions();
  const deleteRole = useDeleteRole();

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];

  const [actionError, setActionError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [permsTarget, setPermsTarget] = useState<RoleView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleView | null>(null);

  return (
    <>
      <PageMeta title="Roles | Admin | Money Manager" description="Manage roles and permissions" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Roles</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Control what each role can see and do.
              {!rolesQuery.isPending && (
                <>
                  {" "}
                  {roles.length} role{roles.length !== 1 ? "s" : ""}
                  {permissions.length > 0 && <> · {permissions.length} permissions available</>}
                </>
              )}
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <HiOutlinePlus className="mr-2 size-4" />
            New role
          </Button>
        </div>

        {rolesQuery.isError && (
          <Alert color="failure">
            Could not load roles.{" "}
            <button type="button" onClick={() => rolesQuery.refetch()} className="font-medium underline">
              Try again
            </button>
          </Alert>
        )}
        {actionError && (
          <Alert color="failure" onDismiss={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}

        {/* squelettes de chargement */}
        {rolesQuery.isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/3"
              />
            ))}
          </div>
        )}

        {!rolesQuery.isPending && !rolesQuery.isError && roles.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-gray-700">
            <HiOutlineShieldCheck className="size-8 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No roles yet. Create your first one.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              totalPermissions={permissions.length}
              onManage={() => setPermsTarget(role)}
              onDelete={() => setDeleteTarget(role)}
            />
          ))}
        </div>
      </div>

      <CreateRoleModal
        show={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />

      <ManagePermissionsModal
        role={permsTarget}
        allPermissions={permissions}
        permissionsLoading={permissionsQuery.isPending}
        permissionsError={permissionsQuery.isError}
        onClose={() => setPermsTarget(null)}
        onSaved={() => setPermsTarget(null)}
      />

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete role"
        message={
          <>
            Delete role <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setActionError(null);
          try {
            await deleteRole.mutateAsync(deleteTarget.id);
          } catch (err: any) {
            setActionError(err?.response?.data?.message ?? "Could not delete this role.");
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}

function RoleCard({
  role,
  totalPermissions,
  onManage,
  onDelete,
}: {
  role: RoleView;
  totalPermissions: number;
  onManage: () => void;
  onDelete: () => void;
}) {
  const count = role.permissions.length;
  const percent = totalPermissions > 0 ? Math.min(100, Math.round((count / totalPermissions) * 100)) : 0;
  const preview = role.permissions.slice(0, 3);
  const extra = count - preview.length;

  const deleteBlockedReason = role.isSystemRole
    ? "System roles cannot be deleted"
    : role.usersCount > 0
      ? "Reassign its users before deleting"
      : null;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-start gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accentFor(role.name)}`}>
          <HiOutlineShieldCheck className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold text-gray-800 dark:text-white/90">{prettyName(role.name)}</h2>
            {role.isSystemRole && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                <HiOutlineLockClosed className="size-3" />
                System
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-400">{role.name}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <HiOutlineUsers className="size-4" />
        {role.usersCount} user{role.usersCount !== 1 ? "s" : ""}
      </div>

      {/* permissions : barre de progression + aperçu */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300">Permissions</span>
          <span className="text-gray-500 dark:text-gray-400">
            {count}
            {totalPermissions > 0 && <> / {totalPermissions}</>}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${percent}%` }} />
        </div>

        <div className="mt-3 flex min-h-6 flex-wrap items-center gap-1.5">
          {count === 0 && <span className="text-xs text-gray-400">No permissions assigned</span>}
          {preview.map((p) => (
            <span
              key={p.code}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300"
            >
              {p.label}
            </span>
          ))}
          {extra > 0 && <span className="text-xs text-gray-400">+{extra} more</span>}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button size="sm" color="light" className="flex-1" onClick={onManage}>
          <HiOutlineCog6Tooth className="mr-1.5 size-4" />
          Manage permissions
        </Button>
        <Button
          size="sm"
          color="light"
          disabled={!!deleteBlockedReason}
          title={deleteBlockedReason ?? "Delete role"}
          onClick={onDelete}
          aria-label="Delete role"
        >
          <HiOutlineTrash className="size-4 text-error-500" />
        </Button>
      </div>
    </div>
  );
}

//create
function CreateRoleModal({
  show,
  onClose,
  onCreated,
}: {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createRole = useCreateRole();
  const loading = createRole.isPending;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setName("");
      setNameError(undefined);
      setError(null);
    }
  }, [show]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name) {
      setNameError("Role name is required.");
      return;
    }
    if (!NAME_PATTERN.test(name)) {
      setNameError("Use UPPER_SNAKE_CASE and start with a letter (e.g. ACCOUNTANT, TEAM_LEAD).");
      return;
    }

    try {
      await createRole.mutateAsync(name);
      onCreated();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setNameError("A role with this name already exists.");
      } else {
        setError(err?.response?.data?.message ?? "Could not create role.");
      }
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="md">
      <ModalHeader>
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <HiOutlineShieldCheck className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-gray-800 dark:text-white/90">New role</span>
            <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
              You will choose its permissions next.
            </span>
          </span>
        </span>
      </ModalHeader>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-3">
            {error && <Alert color="failure">{error}</Alert>}
            <div>
              <Label htmlFor="role-name">
                Role name <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="role-name"
                value={name}
                color={nameError ? "failure" : "gray"}
                aria-invalid={!!nameError}
                onChange={(e) => {
                  setName(e.target.value.toUpperCase().replace(/\s+/g, "_"));
                  setNameError(undefined);
                }}
                placeholder="ACCOUNTANT"
              />
              <FieldError message={nameError} />
              {!nameError && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Uppercase letters, numbers and underscores only.
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create role"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function ManagePermissionsModal({
  role,
  allPermissions,
  permissionsLoading,
  permissionsError,
  onClose,
  onSaved,
}: {
  role: RoleView | null;
  allPermissions: PermissionView[];
  permissionsLoading: boolean;
  permissionsError: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const setPermissions = useSetRolePermissions();
  const loading = setPermissions.isPending;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setSelected(new Set(role.permissions.map((p) => p.code)));
      setError(null);
    }
  }, [role]);

  const groups = useMemo(() => {
    const map = new Map<string, PermissionView[]>();
    for (const p of allPermissions) {
      const key = p.code.split(":")[0];
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return Array.from(map.entries());
  }, [allPermissions]);

  const isLocked = (code: string) => role?.name === "ADMIN" && code === "roles:manage";

  const initial = useMemo(() => new Set(role?.permissions.map((p) => p.code) ?? []), [role]);
  const dirty = selected.size !== initial.size || Array.from(selected).some((c) => !initial.has(c));

  function toggle(code: string) {
    if (isLocked(code)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleGroup(perms: PermissionView[]) {
    const allSelected = perms.every((p) => selected.has(p.code));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of perms) {
        if (allSelected) {
          if (!isLocked(p.code)) next.delete(p.code);
        } else {
          next.add(p.code);
        }
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allPermissions.map((p) => p.code)));
  }

  function clearAll() {
    setSelected(new Set(allPermissions.filter((p) => isLocked(p.code)).map((p) => p.code)));
  }

  async function handleSave() {
    if (!role) return;
    setError(null);
    try {
      await setPermissions.mutateAsync({ id: role.id, permissionCodes: Array.from(selected) });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not update permissions.");
    }
  }

  return (
    <Modal show={!!role} onClose={onClose} size="xl">
      <ModalHeader>
        <span className="flex items-center gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${role ? accentFor(role.name) : ""}`}
          >
            <HiOutlineShieldCheck className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-gray-800 dark:text-white/90">
              {role ? prettyName(role.name) : ""}
            </span>
            <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
              Choose what this role is allowed to do.
            </span>
          </span>
        </span>
      </ModalHeader>

      <ModalBody>
        <div className="flex flex-col gap-5">
          {error && <Alert color="failure">{error}</Alert>}
          {permissionsError && <Alert color="failure">Could not load the permissions list.</Alert>}
          {permissionsLoading && <p className="text-sm text-gray-500">Loading...</p>}

          {role?.name === "ADMIN" && (
            <Alert color="warning">
              <span className="font-medium">Manage roles and permissions</span> is locked for the ADMIN role.
            </Alert>
          )}

          {allPermissions.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-800 dark:text-white/90">{selected.size}</span> of{" "}
                {allPermissions.length} selected
              </p>
              <div className="flex gap-3 text-sm font-medium">
                <button type="button" onClick={selectAll} className="text-brand-500 hover:text-brand-600">
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {groups.map(([key, perms]) => {
            const groupSelected = perms.filter((p) => selected.has(p.code)).length;
            const allSelected = groupSelected === perms.length;
            return (
              <section key={key}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    {groupTitle(key)}{" "}
                    <span className="font-normal normal-case">
                      ({groupSelected}/{perms.length})
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleGroup(perms)}
                    className="text-xs font-medium text-brand-500 hover:text-brand-600"
                  >
                    {allSelected ? "Unselect group" : "Select group"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {perms.map((p) => {
                    const checked = selected.has(p.code);
                    const locked = isLocked(p.code);
                    return (
                      <label
                        key={p.code}
                        className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                          checked
                            ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                        } ${locked ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={locked}
                          onChange={() => toggle(p.code)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-white/90">
                            {p.label}
                            {locked && <HiOutlineLockClosed className="size-3.5 text-gray-400" />}
                          </p>
                          {p.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </ModalBody>

      <ModalFooter className="justify-end">
        <Button color="light" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading || permissionsLoading || permissionsError || !dirty}>
          {loading ? "Saving..." : "Save permissions"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}