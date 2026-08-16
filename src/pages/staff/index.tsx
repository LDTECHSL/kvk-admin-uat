import { Alert } from "@/components/ui/alert";
import { assignModules, createStaffMember, getStaffMembers } from "@/services/staff-api";
import {
  Check,
  Dumbbell,
  Gamepad2,
  Loader2,
  Mail,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Store,
  UserCog,
  Users,
  WashingMachine,
  X,
  Coffee,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  assignedModules?: StaffModule[];
};

type StaffForm = {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
};

type StaffModule =
  | "Gym"
  | "CarWash"
  | "GamingCenter"
  | "BadmintonCourt"
  | "Cafe"
  | "Retail";

type PageAlert = {
  visible: boolean;
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
};

type FormErrors = Partial<Record<keyof StaffForm, string>>;

const initialForm: StaffForm = {
  firstName: "",
  lastName: "",
  userName: "",
  email: "",
};

const moduleOptions: {
  id: StaffModule;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    id: "Gym",
    label: "Gym",
    description: "Gym operations and membership management",
    icon: <Dumbbell size={18} />,
  },
  {
    id: "CarWash",
    label: "Car Wash",
    description: "Car wash bookings and service management",
    icon: <WashingMachine size={18} />,
  },
  {
    id: "GamingCenter",
    label: "Gaming",
    description: "Gaming stations, bookings and availability",
    icon: <Gamepad2 size={18} />,
  },
  {
    id: "BadmintonCourt",
    label: "Badminton",
    description: "Court bookings and slot management",
    icon: <Trophy size={18} />,
  },
  {
    id: "Cafe",
    label: "Cafe",
    description: "Cafe orders and product management",
    icon: <Coffee size={18} />,
  },
  {
    id: "Retail",
    label: "Retail",
    description: "Retail products, stock and sales",
    icon: <Store size={18} />,
  },
];

export default function Staff() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedModules, setSelectedModules] = useState<StaffModule[]>([]);

  const [form, setForm] = useState<StaffForm>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [pageAlert, setPageAlert] = useState<PageAlert>({
    visible: false,
  });

  const handleFetchStaff = async () => {
    try {
      setIsLoading(true);

      const response = await getStaffMembers();
      setStaffMembers(response);
    } catch (error) {
      setStaffMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return staffMembers;
    }

    return staffMembers.filter((staff) => {
      const fullName =
        `${staff.firstName} ${staff.lastName}`.toLowerCase();

      return (
        fullName.includes(search) ||
        staff.userName.toLowerCase().includes(search) ||
        staff.email.toLowerCase().includes(search)
      );
    });
  }, [staffMembers, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStaff.length / itemsPerPage),
  );

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const showingFrom =
    filteredStaff.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const showingTo = Math.min(
    currentPage * itemsPerPage,
    filteredStaff.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    } else if (form.firstName.trim().length < 2) {
      errors.firstName = "First name must contain at least 2 characters.";
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    } else if (form.lastName.trim().length < 2) {
      errors.lastName = "Last name must contain at least 2 characters.";
    }

    if (!form.userName.trim()) {
      errors.userName = "Username is required.";
    } else if (!/^[a-zA-Z0-9._-]+$/.test(form.userName.trim())) {
      errors.userName =
        "Username can only contain letters, numbers, dots, underscores and hyphens.";
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    const duplicateUsername = staffMembers.some(
      (staff) =>
        staff.userName.toLowerCase() === form.userName.trim().toLowerCase(),
    );

    if (duplicateUsername) {
      errors.userName = "This username is already in use.";
    }

    const duplicateEmail = staffMembers.some(
      (staff) =>
        staff.email.toLowerCase() === form.email.trim().toLowerCase(),
    );

    if (duplicateEmail) {
      errors.email = "This email address is already in use.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setForm(initialForm);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    if (isSubmitting) return;

    setIsAddModalOpen(false);
    setForm(initialForm);
    setFormErrors({});
  };

  const handleFormChange = (field: keyof StaffForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }
  };

  const handleAddStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        userName: form.userName.trim(),
        email: form.email.trim(),
        password: form.firstName.trim(),
      };

      await createStaffMember(body);

      setPageAlert({
        visible: true,
        variant: "success",
        title: "Staff member added",
        description: `${body.firstName} ${body.lastName} has been added successfully.`,
      });

      handleCloseAddModal();
    } catch (error) {

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to add staff",
        description:
          "An error occurred while adding the staff member. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      handleFetchStaff();
    }
  };

  const handleOpenModuleModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setSelectedModules(staff.assignedModules ?? []);
    setIsModuleModalOpen(true);
  };

  const handleCloseModuleModal = () => {
    if (isSubmitting) return;

    setSelectedStaff(null);
    setSelectedModules([]);
    setIsModuleModalOpen(false);
  };

  const handleToggleModule = (module: StaffModule) => {
    setSelectedModules((previous) => {
      if (previous.includes(module)) {
        return previous.filter((item) => item !== module);
      }

      return [...previous, module];
    });
  };

  const handleAssignModules = async () => {
    if (!selectedStaff) return;

    try {
      setIsSubmitting(true);

      const body = {
        moduleNames: selectedModules,
      };

      await assignModules(selectedStaff.id, body);

      setPageAlert({
        visible: true,
        variant: "success",
        title: "Modules updated",
        description: `Module access for ${selectedStaff.firstName} ${selectedStaff.lastName} has been updated.`,
      });

      handleCloseModuleModal();
    } catch (error) {

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to assign modules",
        description:
          "An error occurred while updating module access. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      handleFetchStaff();
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <main className="min-h-screen">
      {pageAlert.visible && (
        <Alert
          variant={pageAlert.variant as any}
          title={pageAlert.title}
          description={pageAlert.description}
          onClose={() =>
            setPageAlert((previous) => ({
              ...previous,
              visible: false,
            }))
          }
        />
      )}

      {(isSubmitting || isLoading) &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />

              <p className="text-sm font-medium text-white">
                {isSubmitting ? "Processing..." : "Loading staff..."}
              </p>
            </div>
          </div>,
          document.body,
        )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm shadow-blue-900">
              <Users size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Staff
              </h1>

              <p className="text-sm text-slate-500">
                Manage staff accounts and module access.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleFetchStaff}
              disabled={isLoading}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Add Staff
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryCard
            title="Total Staff"
            value={staffMembers.length}
            icon={<Users size={20} />}
            iconClassName="bg-blue-50 text-blue-900"
          />

          <SummaryCard
            title="Staff With Module Access"
            value={
              staffMembers.filter((staff) => (staff.assignedModules?.length ?? 0) > 0)
                .length
            }
            icon={<ShieldCheck size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Staff Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name, username or email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {filteredStaff.length}
              </span>{" "}
              staff members
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Staff Member
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Username
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length > 0 ? (
                  paginatedStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-indigo-600 text-sm font-bold text-white shadow-sm">
                            {getInitials(staff.firstName, staff.lastName)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {staff.firstName} {staff.lastName}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Staff account
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          @{staff.userName}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Mail
                            size={15}
                            className="shrink-0 text-slate-400"
                          />

                          <span className="max-w-[240px] truncate">
                            {staff.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenModuleModal(staff)}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <UserCog size={16} />
                            Assign Modules
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {filteredStaff.length > 0 ? (
              paginatedStaff.map((staff) => (
                <article key={staff.id} className="p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-sm font-bold text-white">
                      {getInitials(staff.firstName, staff.lastName)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {staff.firstName} {staff.lastName}
                      </h3>

                      <p className="truncate text-xs font-medium text-slate-500">
                        @{staff.userName}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 space-y-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="mb-1 text-xs font-medium text-slate-500">
                        Email
                      </p>

                      <p className="truncate text-sm font-medium text-slate-800">
                        {staff.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenModuleModal(staff)}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <UserCog size={16} />
                    Assign Modules
                  </button>
                </article>
              ))
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && filteredStaff.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredStaff.length}
                  </span>{" "}
                  staff members
                </p>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="items-per-page"
                    className="text-xs font-medium text-slate-500"
                  >
                    Rows:
                  </label>

                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(event) => {
                      setItemsPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.max(previousPage - 1, 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
                >
                  Previous
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, visiblePages) => {
                      const previousPage = visiblePages[index - 1];
                      const showEllipsis =
                        previousPage !== undefined &&
                        page - previousPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
                              ...
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                              currentPage === page
                                ? "bg-blue-900 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <span className="text-sm font-semibold text-slate-600 sm:hidden">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previousPage) =>
                      Math.min(previousPage + 1, totalPages),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </section>
      </div>

      {isAddModalOpen && (
        <AddStaffModal
          form={form}
          errors={formErrors}
          isSubmitting={isSubmitting}
          onChange={handleFormChange}
          onClose={handleCloseAddModal}
          onSubmit={handleAddStaff}
        />
      )}

      {isModuleModalOpen && selectedStaff && (
        <AssignModulesModal
          staff={selectedStaff}
          selectedModules={selectedModules}
          isSubmitting={isSubmitting}
          onToggleModule={handleToggleModule}
          onClose={handleCloseModuleModal}
          onSave={handleAssignModules}
        />
      )}
    </main>
  );
}

type AddStaffModalProps = {
  form: StaffForm;
  errors: FormErrors;
  isSubmitting: boolean;
  onChange: (field: keyof StaffForm, value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AddStaffModal({
  form,
  errors,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: AddStaffModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Add Staff Member
              </h2>

              <p className="text-sm text-slate-500">
                Create a new staff account for KVK Arena.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="First Name"
                required
                value={form.firstName}
                error={errors.firstName}
                placeholder="Enter first name"
                onChange={(value) => onChange("firstName", value)}
              />

              <FormField
                label="Last Name"
                required
                value={form.lastName}
                error={errors.lastName}
                placeholder="Enter last name"
                onChange={(value) => onChange("lastName", value)}
              />

              <FormField
                label="Username"
                required
                value={form.userName}
                error={errors.userName}
                placeholder="Enter username"
                onChange={(value) => onChange("userName", value)}
              />

              <FormField
                label="Email Address"
                required
                type="email"
                value={form.email}
                error={errors.email}
                placeholder="name@example.com"
                onChange={(value) => onChange("email", value)}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Adding staff
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Add Staff
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

type AssignModulesModalProps = {
  staff: StaffMember;
  selectedModules: StaffModule[];
  isSubmitting: boolean;
  onToggleModule: (module: StaffModule) => void;
  onClose: () => void;
  onSave: () => void;
};

function AssignModulesModal({
  staff,
  selectedModules,
  isSubmitting,
  onToggleModule,
  onClose,
  onSave,
}: AssignModulesModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Assign Modules
              </h2>

              <p className="text-sm text-slate-500">
                Select modules available to {staff.firstName} {staff.lastName}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {staff.firstName} {staff.lastName}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              @{staff.userName} · {staff.email}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {moduleOptions.map((module) => {
              const checked = selectedModules.includes(module.id);

              return (
                <label
                  key={module.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    checked
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-900 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleModule(module.id)}
                    disabled={isSubmitting}
                    className="sr-only"
                  />

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      checked
                        ? "bg-blue-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {module.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {module.label}
                      </p>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          checked
                            ? "border-blue-600 bg-blue-900 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && <Check size={14} />}
                      </div>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {module.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs font-medium text-slate-500">
            {selectedModules.length} module
            {selectedModules.length === 1 ? "" : "s"} selected
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Save Access
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  type?: "text" | "email";
  required?: boolean;
  onChange: (value: string) => void;
};

function FormField({
  label,
  value,
  placeholder,
  error,
  type = "text",
  required,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
};

function SummaryCard({
  title,
  value,
  icon,
  iconClassName,
}: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Users size={26} />
      </div>

      <h3 className="font-semibold text-slate-900">
        No staff members found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        No staff members match the current search, or no staff accounts have
        been created yet.
      </p>
    </div>
  );
}