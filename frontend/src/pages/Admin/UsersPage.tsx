import {
  Alert,
  Badge,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  ToggleSwitch,
} from "flowbite-react";
import { useEffect, useState } from "react";
import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineArrowDownTray,
  HiOutlineInformationCircle,
  HiOutlineKey,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import PageMeta from "../../common/PageMeta";
import UserAvatar from "../../common/UserAvatar";
import ConfirmModal from "../../common/ConfirmModal";
import FieldError from "../../common/FieldError";
import PasswordRequirements from "../../common/PasswordRequirements";
import BirthDatePicker from "../../common/BirthDatePicker";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useAuthStore } from "../../store/authStore";
import { type RoleView } from "../../services/rolesService";
import { type AdminUserListItem } from "../../services/adminService";
import { isPasswordValid } from "../../lib/passwordRules";
import { MIN_AGE, getAge } from "../../lib/age";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useAdminUsers,
  useChangeUserRole,
  useCreateUser,
  useDeleteUser,
  useExportUsersCsv,
  useRoles,
  useUpdateUser,
} from "../../hooks/useAdminUsers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 10;

type SortField = "createdAt" | "firstName" | "email";
type SortOrder = "asc" | "desc";

type Filters = {
  search: string;
  role: string;
  status: "all" | "verified" | "unverified";
  provider: "all" | "google" | "password";
  sortBy: SortField;
  sortOrder: SortOrder;
};

const INITIAL_FILTERS: Filters = {
  search: "",
  role: "",
  status: "all",
  provider: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
};

function generatePassword(length = 12) {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const rand = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const pick = (set: string) => set[rand(set.length)];

  const chars = [pick(lower), pick(upper), pick(digits)];
  while (chars.length < length) chars.push(pick(lower + upper + digits));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function SortHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  field: SortField;
  label: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-left hover:text-gray-700 dark:hover:text-gray-200"
    >
      {label}
      <span className="flex flex-col">
        <HiChevronUp
          className={`-mb-1 size-3 ${active && sortOrder === "asc" ? "text-brand-500" : "text-gray-300 dark:text-gray-600"}`}
        />
        <HiChevronDown
          className={`size-3 ${active && sortOrder === "desc" ? "text-brand-500" : "text-gray-300 dark:text-gray-600"}`}
        />
      </span>
    </button>
  );
}

export default function AdminUsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  const { data: roles = [] } = useRoles();
  const { data, isPending, isError, isFetching } = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    role: filters.role || undefined,
    status: filters.status,
    provider: filters.provider,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
  const deleteUser = useDeleteUser();
  const exportCsv = useExportUsersCsv();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

  useEffect(() => {
    if (data && data.meta.totalPages > 0 && page > data.meta.totalPages) {
      setPage(data.meta.totalPages);
    }
  }, [data, page]);

  function updateFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function toggleSort(field: SortField) {
    setFilters((prev) =>
      prev.sortBy === field
        ? { ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }
        : { ...prev, sortBy: field, sortOrder: "asc" },
    );
    setPage(1);
  }

  return (
    <>
      <PageMeta title="Users | Admin | Money Manager" description="Manage users" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Users</h1>
          <div className="flex gap-2">
            <Button
              color="light"
              size="sm"
              onClick={() => exportCsv.mutate()}
              disabled={exportCsv.isPending}
            >
              <HiOutlineArrowDownTray className="mr-2 size-4" />
              {exportCsv.isPending ? "Exporting..." : "Export CSV"}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <HiOutlinePlus className="mr-2 size-4" />
              New user
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TextInput
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="min-w-64"
          />
          <Select
            value={filters.role}
            onChange={(e) => updateFilters({ role: e.target.value })}
            className="w-40"
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value as Filters["status"] })}
            className="w-40"
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </Select>
          <Select
            value={filters.provider}
            onChange={(e) => updateFilters({ provider: e.target.value as Filters["provider"] })}
            className="w-40"
          >
            <option value="all">All sign-in methods</option>
            <option value="password">Email & password</option>
            <option value="google">Google</option>
          </Select>
        </div>

        {isError && <Alert color="failure">Could not load users.</Alert>}
        {actionError && (
          <Alert color="failure" onDismiss={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}
        {exportCsv.isError && <Alert color="failure">Could not export users.</Alert>}

        <div
          className={`overflow-x-auto rounded-xl border border-gray-200 transition-opacity dark:border-gray-800 ${
            isFetching && !isPending ? "opacity-60" : ""
          }`}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>
                  <SortHeader
                    field="firstName"
                    label="User"
                    sortBy={filters.sortBy}
                    sortOrder={filters.sortOrder}
                    onSort={toggleSort}
                  />
                </TableHeadCell>
                <TableHeadCell>Role</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Sign-in</TableHeadCell>
                <TableHeadCell>
                  <SortHeader
                    field="createdAt"
                    label="Joined"
                    sortBy={filters.sortBy}
                    sortOrder={filters.sortOrder}
                    onSort={toggleSort}
                  />
                </TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isPending && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {items.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <TableRow key={u.id} className="bg-white dark:bg-gray-900">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={u.profileAvatar}
                          firstName={u.firstName}
                          lastName={u.lastName}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => !isSelf && setRoleTarget(u)}
                        disabled={isSelf}
                        className="disabled:cursor-not-allowed"
                        title={isSelf ? "You cannot change your own role" : "Change role"}
                      >
                        <Badge color="indigo">{u.role}</Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge color={u.isEmailVerified ? "success" : "warning"}>
                        {u.isEmailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={u.googleLinked ? "purple" : "gray"}>
                        {u.googleLinked ? "Google" : "Password"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="xs" color="light" onClick={() => setEditTarget(u)}>
                          <HiOutlinePencil className="size-4" />
                        </Button>
                        <Button
                          size="xs"
                          color="failure"
                          disabled={isSelf}
                          title={isSelf ? "You cannot delete your own account" : "Delete"}
                          onClick={() => !isSelf && setDeleteTarget(u)}
                        >
                          <HiOutlineTrash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <CreateUserModal
        show={createOpen}
        roles={roles}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
        }}
      />
      <EditUserModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => setEditTarget(null)}
      />
      <ChangeRoleModal
        target={roleTarget}
        roles={roles}
        onClose={() => setRoleTarget(null)}
        onSaved={() => setRoleTarget(null)}
      />
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete user"
        message={
          <>
            Delete{" "}
            <strong>
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </strong>
            ? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setActionError(null);
          try {
            await deleteUser.mutateAsync(deleteTarget.id);
          } catch {
            setActionError("Could not delete this user. It may have related data.");
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}

// create
type CreateField = "firstName" | "lastName" | "dateOfBirth" | "email" | "password";
type CreateErrors = Partial<Record<CreateField, string>>;

function CreateUserModal({
  show,
  roles,
  onClose,
  onCreated,
}: {
  show: boolean;
  roles: RoleView[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const createUser = useCreateUser();
  const loading = createUser.isPending;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("USER");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateErrors>({});

  useEffect(() => {
    if (show) {
      setFirstName("");
      setLastName("");
      setDateOfBirth(undefined);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setRole("USER");
      setError(null);
      setFieldErrors({});
    }
  }, [show]);

  function clearFieldError(field: CreateField) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleGenerate() {
    setPassword(generatePassword());
    setShowPassword(true); 
    clearFieldError("password");
  }

  function validate(): CreateErrors {
    const errors: CreateErrors = {};

    if (!firstName.trim()) errors.firstName = "First name is required.";
    else if (firstName.trim().length < 2) errors.firstName = "At least 2 characters.";

    if (!lastName.trim()) errors.lastName = "Last name is required.";
    else if (lastName.trim().length < 2) errors.lastName = "At least 2 characters.";

    if (!dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
    else if (getAge(dateOfBirth) < MIN_AGE) errors.dateOfBirth = `Minimum age is ${MIN_AGE} years.`;

    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (!isPasswordValid(password)) errors.password = "Password does not meet all the requirements.";

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !dateOfBirth) return;

    try {
      await createUser.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        email: email.trim(),
        password,
        role,
      });
      onCreated();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setFieldErrors({ email: "This email is already registered." });
      } else {
        setError(err?.response?.data?.message ?? "Could not create user.");
      }
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="2xl">
      <ModalHeader>
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <HiOutlineUserPlus className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-gray-800 dark:text-white/90">New user</span>
            <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
              Create an account and send a verification email.
            </span>
          </span>
        </span>
      </ModalHeader>

      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            {error && (
              <Alert color="failure" className="sm:col-span-2">
                {error}
              </Alert>
            )}

            <div>
              <Label htmlFor="create-firstName">
                First name <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="create-firstName"
                placeholder="Enter first name"
                color={fieldErrors.firstName ? "failure" : "gray"}
                aria-invalid={!!fieldErrors.firstName}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError("firstName");
                }}
              />
              <FieldError message={fieldErrors.firstName} />
            </div>

            <div>
              <Label htmlFor="create-lastName">
                Last name <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="create-lastName"
                placeholder="Enter last name"
                color={fieldErrors.lastName ? "failure" : "gray"}
                aria-invalid={!!fieldErrors.lastName}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError("lastName");
                }}
              />
              <FieldError message={fieldErrors.lastName} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="create-email">
                Email <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="create-email"
                type="email"
                placeholder="name@example.com"
                color={fieldErrors.email ? "failure" : "gray"}
                aria-invalid={!!fieldErrors.email}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div>
              <Label htmlFor="create-dateOfBirth">
                Date of birth <span className="text-error-500">*</span>
              </Label>
              <BirthDatePicker
                id="create-dateOfBirth"
                value={dateOfBirth}
                hasError={!!fieldErrors.dateOfBirth}
                onChange={(v) => {
                  setDateOfBirth(v);
                  clearFieldError("dateOfBirth");
                }}
              />
              <FieldError message={fieldErrors.dateOfBirth} />
            </div>

            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select id="create-role" value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <Label htmlFor="create-password" className="mb-0">
                  Temporary password <span className="text-error-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  <HiOutlineKey className="size-4" />
                  Generate
                </button>
              </div>
              <div className="relative">
                <TextInput
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a password or generate one"
                  color={fieldErrors.password ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.password}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
              <FieldError message={fieldErrors.password} />
              {(password || fieldErrors.password) && <PasswordRequirements password={password} compact />}
            </div>

            <p className="flex items-start gap-2 text-xs text-gray-500 sm:col-span-2 dark:text-gray-400">
              <HiOutlineInformationCircle className="mt-0.5 size-4 shrink-0" />
              A verification email will be sent to this address. Share the temporary password with the user
              securely.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="justify-end">
          <Button color="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create user"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

//edit
type EditField = "firstName" | "lastName" | "email" | "password";
type EditErrors = Partial<Record<EditField, string>>;

function EditUserModal({
  target,
  onClose,
  onSaved,
}: {
  target: AdminUserListItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateUser = useUpdateUser();
  const loading = updateUser.isPending;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendVerificationEmail, setSendVerificationEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EditErrors>({});

  useEffect(() => {
    if (target) {
      setFirstName(target.firstName);
      setLastName(target.lastName);
      setEmail(target.email);
      setPassword("");
      setShowPassword(false);
      setSendVerificationEmail(true);
      setError(null);
      setFieldErrors({});
    }
  }, [target]);

  const emailChanged = target ? email !== target.email : false;

  function clearFieldError(field: EditField) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validate(): EditErrors {
    const errors: EditErrors = {};

    if (!firstName.trim()) errors.firstName = "First name is required.";
    else if (firstName.trim().length < 2) errors.firstName = "At least 2 characters.";

    if (!lastName.trim()) errors.lastName = "Last name is required.";
    else if (lastName.trim().length < 2) errors.lastName = "At least 2 characters.";

    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Please enter a valid email address.";

    if (password && !isPasswordValid(password)) errors.password = "Password does not meet all the requirements.";

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateUser.mutateAsync({
        id: target.id,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password || undefined,
          sendVerificationEmail,
        },
      });
      onSaved();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setFieldErrors({ email: "This email is already registered." });
      } else {
        setError(err?.response?.data?.message ?? "Could not update user.");
      }
    }
  }

  return (
    <Modal show={!!target} onClose={onClose}>
      <ModalHeader>Edit user</ModalHeader>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-4">
            {error && <Alert color="failure">{error}</Alert>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-firstName">
                  First name <span className="text-error-500">*</span>
                </Label>
                <TextInput
                  id="edit-firstName"
                  color={fieldErrors.firstName ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.firstName}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError("firstName");
                  }}
                />
                <FieldError message={fieldErrors.firstName} />
              </div>
              <div>
                <Label htmlFor="edit-lastName">
                  Last name <span className="text-error-500">*</span>
                </Label>
                <TextInput
                  id="edit-lastName"
                  color={fieldErrors.lastName ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.lastName}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError("lastName");
                  }}
                />
                <FieldError message={fieldErrors.lastName} />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-email">
                Email <span className="text-error-500">*</span>
              </Label>
              <TextInput
                id="edit-email"
                type="email"
                color={fieldErrors.email ? "failure" : "gray"}
                aria-invalid={!!fieldErrors.email}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
              />
              <FieldError message={fieldErrors.email} />
            </div>

            {emailChanged && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Send verification email
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sendVerificationEmail
                      ? "A confirmation link will be sent to the new address. It stays unverified until confirmed."
                      : "The new email will be marked verified immediately, without sending anything."}
                  </p>
                </div>
                <ToggleSwitch checked={sendVerificationEmail} onChange={setSendVerificationEmail} />
              </div>
            )}

            <div>
              <Label htmlFor="edit-password">New password</Label>
              <div className="relative">
                <TextInput
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  color={fieldErrors.password ? "failure" : "gray"}
                  aria-invalid={!!fieldErrors.password}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="Leave empty to keep current password"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
              <FieldError message={fieldErrors.password} />
              {password && <PasswordRequirements password={password} compact />}
              {password && (
                <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                  This user will be signed out of all devices.
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
            {loading ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function ChangeRoleModal({
  target,
  roles,
  onClose,
  onSaved,
}: {
  target: AdminUserListItem | null;
  roles: RoleView[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const changeRole = useChangeUserRole();
  const loading = changeRole.isPending;

  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setRole(target.role);
      setError(null);
    }
  }, [target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setError(null);

    try {
      await changeRole.mutateAsync({ id: target.id, role });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not change role.");
    }
  }

  return (
    <Modal show={!!target} onClose={onClose} size="sm">
      <ModalHeader>Change role</ModalHeader>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <div className="flex flex-col gap-4">
            {error && <Alert color="failure">{error}</Alert>}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {target?.firstName} {target?.lastName} will be signed out of other devices.
            </p>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Change role"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}