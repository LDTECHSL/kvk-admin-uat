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
  Utensils,
  RefreshCw,
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
  const [isLoading, setIsLoading] = useState(true);
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

      setItems(mapped.filter((item) => item.category === 1 || item.category === 4));
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
    <div className="page-container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Utensils size={24} /></span>
          <div><h1 className="page-heading">Menu</h1><p className="mt-1 text-sm text-slate-500">Manage caf? items, pricing and availability.</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" disabled={busy} onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={18} />Refresh</button>
          <button type="button" disabled={busy} onClick={() => openForm()} className="action-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"><Plus size={18} />Add Menu Item</button>
        </div>
      </div>
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <div className="surface-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-5">
          <div className="relative w-full sm:min-w-64 sm:flex-1"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search menu" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search items or ingredients..." className="field-control h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
          <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="field-control h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="all">All categories</option>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="h-11 rounded-xl px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">Clear filters</button>}
        </div>
        {error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto" aria-busy={isLoading}>
          <table className="w-full min-w-[880px] text-left text-sm">
            <caption className="sr-only">Caf? menu catalog</caption>
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th scope="col" className="px-6 py-4">Menu item</th><th scope="col" className="px-6 py-4">Category</th><th scope="col" className="px-6 py-4 text-right">Price</th><th scope="col" className="px-6 py-4">Preparation</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500"><Loader2 size={20} className="mr-2 inline animate-spin text-blue-700" />Loading menu...</td></tr>
                : !filteredItems.length ? <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">{error ? "Menu could not be loaded. Try refreshing." : "No menu items found."}</td></tr>
                : filteredItems.map((item) => <tr key={item.id} className="transition hover:bg-blue-50/30">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{item.image ? <img src={`data:image/png;base64,${item.image}`} alt="" className="h-full w-full object-cover" /> : <ImageOff size={20} className="text-slate-400" />}</div><div className="min-w-0"><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 max-w-xs truncate text-xs text-slate-500" title={item.description}>{item.description || "No description"}</p></div></div></td>
                  <td className="px-6 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{categoryLabel(item.category)}</span></td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums text-slate-900">{formatLkr(item.price)}</td>
                  <td className="px-6 py-4"><div className="space-y-1 text-xs text-slate-500">{item.preparationTimeInMinutes > 0 ? <p className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={14} />{item.preparationTimeInMinutes} min</p> : <p>?</p>}{portionSizeLabel(item.portionSize) && <p className="flex items-center gap-1.5"><Users size={14} />{portionSizeLabel(item.portionSize)}</p>}</div></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2">
                    <button type="button" title="View item" aria-label={`View ${item.name}`} onClick={() => setViewItem(item)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"><Eye size={16} /></button>
                    <button type="button" title="Edit item" aria-label={`Edit ${item.name}`} disabled={busy} onClick={() => openForm(item)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"><Pencil size={16} /></button>
                    <button type="button" title="Delete item" aria-label={`Delete ${item.name}`} disabled={busy} onClick={() => { setDeleteTarget(item); setDeleteError(""); setNotice(""); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                  </div></td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">{isLoading ? "Loading catalog" : `${filteredItems.length} ${filteredItems.length === 1 ? "menu item" : "menu items"} ? ${items.length} total`}</div>
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
          <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDeleteTarget(null)} className="action-secondary h-11 rounded-xl px-4 text-sm">Cancel</button>
            <button type="button" disabled={busy} onClick={() => void remove()} className="inline-flex items-center gap-2 h-11 rounded-xl bg-red-700 px-4 text-sm text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}Delete</button></div>
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
                  className="cursor-pointer h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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
