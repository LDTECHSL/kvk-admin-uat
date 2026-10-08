import { notifyValidation } from "@/lib/notifications";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Loader2,
  Clock,
  ImageOff,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  X,
  Sparkles,
  Plus,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { getCafeMenu, createCafeMenuItem, updateCafeMenuItem, deleteCafeMenuItem } from "@/services/cafe-api";
import MenuFormModal from "./form";
import { CATEGORY_OPTIONS, emptyMenuForm, buildMenuPayload, validateMenuForm, type MenuForm, type MenuErrors } from "./form-model";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: number;
  isActive: boolean;
  facts: string;
  ingredients: string;
  preparationTimeInMinutes: number;
  portionSize: number;
  image: string | null;
};

const categoryLabel = (category: number) =>
  CATEGORY_OPTIONS.find((option) => Number(option.value) === category)?.label ?? "Other";

const portionSizeLabel = (size: number) => {
  switch (size) {
    case 1:
      return "For 1";
    case 2:
      return "For 2";
    case 3:
      return "For 3";
    case 4:
      return "For 4";
    default:
      return null;
  }
};

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formFrom = (item: MenuItem): MenuForm => ({
  name: item.name, price: String(item.price), category: item.category,
  description: item.description, facts: item.facts,
  ingredients: item.ingredients.split(",").map((value) => value.trim()).filter(Boolean),
  preparationTimeInMinutes: String(item.preparationTimeInMinutes),
  portionSize: String(item.portionSize), isActive: item.isActive,
});
const errorMessage = (error: any) => {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  return error?.message || "The operation failed. Please try again.";
};
const requireSuccess = (data: any) => {
  if (data?.succeeded === false) throw new Error(data.message || "The operation failed.");
};

export default function CafeMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useFeedbackState<string>("", "error");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewItem, setViewItem] = useState<MenuItem | null>(null);
  const [modal, setModal] = useState<{ item?: MenuItem } | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyMenuForm);
  const [image, setImage] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<MenuErrors>({});
  const [formError, setFormError] = useFeedbackState<string>("", "error");
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deleteError, setDeleteError] = useFeedbackState<string>("", "error");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useFeedbackState<string>("", "success");

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getCafeMenu();

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: MenuItem[] = Array.isArray(rows)
        ? rows.map((item: any) => ({
            id: item.id,
            name: item.name ?? "",
            description: item.description ?? "",
            price: Number(item.price ?? 0),
            category: Number(item.category ?? 1),
            isActive: !!item.isActive,
            facts: item.facts ?? "",
            ingredients: item.ingredients ?? "",
            preparationTimeInMinutes: Number(item.preparationTimeInMinutes ?? 0),
            portionSize: Number(item.portionSize ?? 0),
            image: item.image || null,
          }))
        : [];

      setItems(mapped);
    } catch {
      setItems([]);
      setError("Failed to load the menu.");
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = (item?: MenuItem) => {
    setForm(item ? formFrom(item) : { ...emptyMenuForm, ingredients: [] });
    setImage(null); setFieldErrors({}); setFormError(""); setNotice(""); setModal({ item });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || busy) return;
    setFormError("");
    const errors = validateMenuForm(form, !!image || !!modal.item?.image);
    setFieldErrors(errors);
    notifyValidation(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      const payload = buildMenuPayload(form, modal.item?.id, image);
      requireSuccess(await (modal.item ? updateCafeMenuItem(payload) : createCafeMenuItem(payload)));
      setModal(null); setNotice(`Menu item ${modal.item ? "updated" : "created"}.`);
      await loadMenu();
    } catch (err) { setFormError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const toggleStatus = async (item: MenuItem) => {
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      requireSuccess(await updateCafeMenuItem(buildMenuPayload({ ...formFrom(item), isActive: !item.isActive }, item.id)));
      setNotice(`${item.name} ${item.isActive ? "deactivated" : "activated"}.`);
      await loadMenu();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true); setDeleteError("");
    try {
      requireSuccess(await deleteCafeMenuItem(deleteTarget.id));
      setDeleteTarget(null); setNotice("Menu item deleted.");
      await loadMenu();
    } catch (err) { setDeleteError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "all" && String(item.category) !== categoryFilter) return false;
    if (statusFilter === "active" && !item.isActive) return false;
    if (statusFilter === "inactive" && item.isActive) return false;
    if (!normalizedSearchTerm) return true;

    return [item.name, item.description, item.ingredients]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const hasActiveFilters = categoryFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="page-container">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-heading">Menu</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage café menu items</p>
          </div>

          <button type="button" disabled={busy} onClick={() => openForm()} className="action-primary inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50 sm:w-auto"><Plus size={16} />Add Menu Item</button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="w-full sm:min-w-64 sm:flex-1">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="field-control w-full outline-none text-sm"
                placeholder="Search by name, description, or ingredients..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="field-control rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="field-control rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer text-sm font-medium text-blue-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading menu...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No menu items found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const portion = portionSizeLabel(item.portionSize);

              return (
                <div
                  key={item.id}
                  className="surface-panel group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-gray-50">
                    {item.image ? (
                      <img
                        src={`data:image/png;base64,${item.image}`}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <ImageOff size={28} className="text-gray-300" />
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setViewItem(item)}
                        className="flex translate-y-2 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-lg transition-transform duration-300 group-hover:translate-y-0 hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                      <span
                        className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1 text-xl font-bold text-blue-900">
                      {formatLkr(item.price)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {categoryLabel(item.category)}
                      </span>
                      {item.preparationTimeInMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {item.preparationTimeInMinutes} min
                        </span>
                      )}
                      {portion && (
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {portion}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {item.ingredients && (
                      <p className="mt-2 text-xs text-gray-400 line-clamp-1">
                        Ingredients: {item.ingredients}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
                      <button type="button" disabled={busy} onClick={() => openForm(item)} className="action-secondary inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm disabled:opacity-50"><Pencil size={14} />Edit</button>
                      <button type="button" disabled={busy} onClick={() => void toggleStatus(item)} className="action-secondary inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm disabled:opacity-50"><Power size={14} />{item.isActive ? "Deactivate" : "Activate"}</button>
                      <button type="button" disabled={busy} onClick={() => { setDeleteTarget(item); setDeleteError(""); setNotice(""); }} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-2 text-sm text-red-700 disabled:opacity-50"><Trash2 size={14} />Delete</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {modal && <MenuFormModal form={form} errors={fieldErrors} error={formError} image={image}
        existingImage={modal.item?.image} editing={!!modal.item} busy={busy}
        onChange={(values) => { setForm(values); setFieldErrors({}); }}
        onImage={(file) => { setImage(file); setFieldErrors((errors) => ({ ...errors, image: undefined })); }}
        onClose={() => { if (!busy) setModal(null); }} onSubmit={submit} />}
      {deleteTarget && createPortal(<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="cafe-delete-title" className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <h2 id="cafe-delete-title" className="text-lg font-semibold">Delete Menu Item</h2><p className="text-sm text-gray-600">Permanently delete “{deleteTarget.name}”? This cannot be undone.</p>
          {deleteError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
          <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDeleteTarget(null)} className="action-secondary rounded-lg px-4 py-2 text-sm">Cancel</button>
            <button type="button" disabled={busy} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}Delete</button></div>
        </div>
      </div>, document.body)}
      {viewItem &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setViewItem(null);
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="relative flex h-48 shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-gray-50">
                {viewItem.image ? (
                  <img
                    src={`data:image/png;base64,${viewItem.image}`}
                    alt={viewItem.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff size={36} className="text-gray-300" />
                )}
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:bg-white hover:text-gray-900"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{viewItem.name}</h2>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      viewItem.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {viewItem.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {viewItem.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {formatLkr(viewItem.price)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {categoryLabel(viewItem.category)}
                  </span>
                  {viewItem.preparationTimeInMinutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {viewItem.preparationTimeInMinutes} min
                    </span>
                  )}
                  {portionSizeLabel(viewItem.portionSize) && (
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {portionSizeLabel(viewItem.portionSize)}
                    </span>
                  )}
                </div>

                {viewItem.description && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Description
                    </h3>
                    <p className="mt-1 text-sm text-gray-700">{viewItem.description}</p>
                  </div>
                )}

                {viewItem.ingredients && (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Ingredients
                    </h3>
                    <p className="mt-1 text-sm text-gray-700">{viewItem.ingredients}</p>
                  </div>
                )}

                {viewItem.facts && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-sm text-amber-800">{viewItem.facts}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setViewItem(null)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
