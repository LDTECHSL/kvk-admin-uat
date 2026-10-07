import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ImageOff, Loader2, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import CatalogFormModal from "./catalog-form";
import { validateCatalogForm, type CatalogForm, type FormErrors } from "./catalog-form-model";
import {
  getCarWashServices, getCarWashPackages, createCarWashService, updateCarWashService,
  deleteCarWashService, createCarWashPackage, updateCarWashPackage, deleteCarWashPackage,
} from "@/services/car-wash-api";

type Item = {
  id: string; title: string; description: string; price: number; features: string;
  basPrice: number; pricesWithoutDiscounts: number; isActive: boolean;
  image: string | null; services: Item[];
};
const emptyForm: CatalogForm = {
  title: "", description: "", price: "", pricesWithoutDiscounts: "0",
  features: [""], isActive: true, serviceIds: [],
};
const rowsFrom = (data: any): any[] => {
  const rows = data?.additionalData?.response ?? data?.response ?? data;
  return Array.isArray(rows) ? rows : [];
};
const mapItem = (row: any): Item => ({
  id: row.id, title: row.title ?? "", description: row.description ?? "",
  price: Number(row.price ?? 0), features: row.features ?? "",
  basPrice: Number(row.basPrice ?? 0), pricesWithoutDiscounts: Number(row.pricesWithoutDiscounts ?? 0),
  isActive: row.isActive ?? true, image: row.image || null,
  services: Array.isArray(row.services) ? row.services.map(mapItem) : [],
});
const formFrom = (item: Item, isPackage: boolean): CatalogForm => ({
  title: item.title, description: item.description,
  price: String(isPackage ? item.basPrice : item.price),
  pricesWithoutDiscounts: String(item.pricesWithoutDiscounts),
  features: item.features.split(",").map((feature) => feature.trim()).filter(Boolean).length
    ? item.features.split(",").map((feature) => feature.trim()).filter(Boolean) : [""],
  isActive: item.isActive, serviceIds: item.services.map((service) => service.id),
});
const messageFrom = (error: any) => {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  return error?.message || "The operation failed. Please try again.";
};
const requireSuccess = (data: any) => {
  if (data?.succeeded === false) throw new Error(data.message || "The operation failed.");
};
const formatLkr = (value: number) => `LKR ${value.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
const fieldClass = "field-control w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500";

export default function CarWashCatalog({ kind }: { kind: "services" | "packages" }) {
  const isPackage = kind === "packages";
  const singular = isPackage ? "package" : "service";
  const [items, setItems] = useState<Item[]>([]);
  const [services, setServices] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState<{ item?: Item } | null>(null);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, availableServices] = await Promise.all([
        isPackage ? getCarWashPackages() : getCarWashServices(),
        isPackage ? getCarWashServices() : Promise.resolve([]),
      ]);
      requireSuccess(catalog);
      requireSuccess(availableServices);
      setItems(rowsFrom(catalog).map(mapItem));
      setServices(rowsFrom(availableServices).map(mapItem));
    } catch (err) { setError(messageFrom(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [kind]);

  const openForm = (item?: Item) => {
    setForm(item ? formFrom(item, isPackage) : { ...emptyForm, serviceIds: [] });
    setImage(null); setFormError(""); setFieldErrors({}); setNotice(""); setModal({ item });
  };
  const saveItem = async (values: CatalogForm, item?: Item, file?: File | null) => {
    const payload = new FormData();
    if (item) payload.append("Id", item.id);
    payload.append("Title", values.title.trim());
    payload.append("Description", values.description.trim());
    payload.append("IsActive", String(values.isActive));
    payload.append(isPackage ? "BasPrice" : "Price", String(Number(values.price)));
    if (isPackage) {
      payload.append("PricesWithoutDiscounts", String(Number(values.pricesWithoutDiscounts)));
      values.serviceIds.forEach((id) => payload.append("ServiceIds", id));
    } else { payload.append("Features", values.features.map((feature) => feature.trim()).filter(Boolean).join(",")); }
    if (file) payload.append("Image", file);
    requireSuccess(isPackage
      ? await (item ? updateCarWashPackage(payload) : createCarWashPackage(payload))
      : await (item ? updateCarWashService(payload) : createCarWashService(payload)));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || busy) return;
    setFormError("");
    const regularTotal = services.filter((service) => form.serviceIds.includes(service.id))
      .reduce((total, service) => total + service.price, 0);
    const errors = validateCatalogForm(form, isPackage, regularTotal, !modal.item, !!image);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      await saveItem(isPackage ? { ...form, pricesWithoutDiscounts: String(regularTotal) } : form, modal.item, image);
      setModal(null);
      setNotice(`${isPackage ? "Package" : "Service"} ${modal.item ? "updated" : "created"}.`);
      await load();
    } catch (err) { setFormError(messageFrom(err)); }
    finally { setBusy(false); }
  };
  const toggleStatus = async (item: Item) => {
    if (busy) return;
    setBusy(true); setNotice(""); setError("");
    try {
      await saveItem({ ...formFrom(item, isPackage), isActive: !item.isActive }, item);
      setNotice(`${item.title} ${item.isActive ? "deactivated" : "activated"}.`);
      await load();
    } catch (err) { setError(messageFrom(err)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true); setDeleteError("");
    try {
      requireSuccess(await (isPackage ? deleteCarWashPackage(deleteTarget.id) : deleteCarWashService(deleteTarget.id)));
      setDeleteTarget(null); setNotice(`${isPackage ? "Package" : "Service"} deleted.`);
      await load();
    } catch (err) { setDeleteError(messageFrom(err)); }
    finally { setBusy(false); }
  };
  const filtered = items.filter((item) => {
    if (status !== "all" && item.isActive !== (status === "active")) return false;
    return [item.title, item.description, item.features, ...item.services.map((service) => service.title)]
      .join(" ").toLowerCase().includes(search.trim().toLowerCase());
  });

  return <div className="page-container space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="page-heading">{isPackage ? "Packages" : "Services"}</h1><p className="mt-1 text-sm text-gray-500">Manage car wash {kind}.</p></div>
      <button type="button" disabled={busy} onClick={() => openForm()} className="action-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"><Plus size={16} />New {singular}</button>
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex min-w-60 flex-1 items-center gap-2"><Search size={16} className="text-gray-400" /><input aria-label={`Search ${kind}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${kind}...`} className={fieldClass} /></div>
      <select aria-label="Status filter" value={status} onChange={(event) => setStatus(event.target.value)} className="field-control rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <button type="button" onClick={() => void load()} disabled={loading || busy} className="action-secondary rounded-lg px-3 py-2 text-sm disabled:opacity-50">Refresh</button>
    </div>
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="flex justify-center py-16 text-gray-500"><Loader2 className="mr-2 animate-spin" size={20} />Loading {kind}...</div>
      : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="col-span-full rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">No {kind} found.</p>}
        {filtered.map((item) => <article key={item.id} className="surface-panel flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex h-36 items-center justify-center bg-blue-50">{item.image ? <img src={`data:image/jpeg;base64,${item.image}`} alt={item.title} className="h-full w-full object-cover" /> : <ImageOff size={28} className="text-gray-300" />}</div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-2"><h2 className="font-semibold text-gray-900">{item.title}</h2><span className={`rounded-full px-2 py-1 text-xs ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{item.isActive ? "Active" : "Inactive"}</span></div>
            <p className="mt-1 text-xl font-bold text-blue-900">{formatLkr(isPackage ? item.basPrice : item.price)}</p>
            {isPackage && item.pricesWithoutDiscounts > item.basPrice && <p className="text-sm text-gray-400 line-through">{formatLkr(item.pricesWithoutDiscounts)}</p>}
            <p className="mt-3 text-sm text-gray-600">{item.description}</p>
            {!isPackage && item.features && <p className="mt-2 text-sm text-gray-500">{item.features}</p>}
            {isPackage && <div className="mt-3 space-y-1 border-t border-gray-100 pt-3"><p className="text-xs font-semibold text-gray-500">Included services</p>{item.services.map((service) => <div key={service.id} className="flex justify-between gap-2 text-sm text-gray-600"><span>{service.title}{!service.isActive && " (Inactive)"}</span><span>{formatLkr(service.price)}</span></div>)}</div>}
            <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
              <button type="button" disabled={busy} onClick={() => openForm(item)} className="action-secondary inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm disabled:opacity-50"><Pencil size={14} />Edit</button>
              <button type="button" disabled={busy} onClick={() => void toggleStatus(item)} className="action-secondary inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm disabled:opacity-50"><Power size={14} />{item.isActive ? "Deactivate" : "Activate"}</button>
              <button type="button" disabled={busy} onClick={() => { setDeleteTarget(item); setDeleteError(""); setNotice(""); }} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-2 text-sm text-red-700 disabled:opacity-50"><Trash2 size={14} />Delete</button>
            </div>
          </div>
        </article>)}
      </div>}
    {modal && <CatalogFormModal
      isPackage={isPackage}
      editing={!!modal.item}
      form={form}
      errors={fieldErrors}
      error={formError}
      image={image}
      existingImage={modal.item?.image}
      services={services}
      busy={busy}
      onChange={(values) => { setForm(values); setFieldErrors({}); }}
      onImage={(file) => { setImage(file); setFieldErrors((errors) => ({ ...errors, image: undefined })); }}
      onClose={() => { if (!busy) setModal(null); }}
      onSubmit={submit}
    />}
    {deleteTarget && createPortal(<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="carwash-delete-title" className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="carwash-delete-title" className="text-lg font-semibold">Delete {singular}</h2><p className="text-sm text-gray-600">Permanently delete “{deleteTarget.title}”? This cannot be undone.</p>
        {deleteError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setDeleteTarget(null)} className="action-secondary rounded-lg px-4 py-2 text-sm">Cancel</button><button type="button" disabled={busy} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}Delete</button></div>
      </div>
    </div>, document.body)}
  </div>;
}
