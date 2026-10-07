import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ImagePlus, Loader2, Pencil, Plus, Search, Trash2, UploadCloud, X } from "lucide-react";
import { validateImage, type CatalogForm, type FormErrors } from "./catalog-form-model";

type ServiceOption = { id: string; title: string; price: number; isActive: boolean };
type Props = {
  isPackage: boolean;
  editing: boolean;
  form: CatalogForm;
  errors: FormErrors;
  error: string;
  image: File | null;
  existingImage?: string | null;
  services: ServiceOption[];
  busy: boolean;
  onChange: (form: CatalogForm) => void;
  onImage: (image: File | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};
const money = (value: number) => `LKR ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inputClass = "field-control mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function ErrorText({ children }: { children?: string }) {
  return children ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{children}</p> : null;
}

export default function CatalogFormModal({
  isPackage, editing, form, errors, error, image, existingImage, services, busy,
  onChange, onImage, onClose, onSubmit,
}: Props) {
  const titleId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const imageSource = preview || (existingImage
    ? existingImage.startsWith("data:") ? existingImage : `data:image/jpeg;base64,${existingImage}`
    : "");
  const selectFile = (file?: File) => {
    if (!file || busy) return;
    const validationError = validateImage(file);
    setImageError(validationError ?? "");
    if (!validationError) onImage(file);
  };
  const selectedServices = services.filter((service) => form.serviceIds.includes(service.id));
  const regularTotal = selectedServices.reduce((total, service) => total + service.price, 0);
  const savings = Math.max(0, regularTotal - Number(form.price || 0));
  const discount = regularTotal > 0 ? Math.round(savings / regularTotal * 100) : 0;
  const filteredServices = services.filter((service) => service.title.toLowerCase().includes(serviceSearch.trim().toLowerCase()));
  const singular = isPackage ? "Package" : "Service";
  const update = <K extends keyof CatalogForm>(key: K, value: CatalogForm[K]) => onChange({ ...form, [key]: value });

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form onSubmit={onSubmit} noValidate role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white">{editing ? <Pencil size={20} /> : <Plus size={21} />}</div>
            <div><h2 id={titleId} className="text-xl font-bold text-slate-900">{editing ? "Edit" : "Add"} Car Wash {singular}</h2>
              <p className="text-sm text-slate-500">{isPackage ? "Add package details, pricing and included services." : "Add service information, features and one image."}</p></div>
          </div>
          <button type="button" aria-label="Close form" onClick={onClose} disabled={busy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <fieldset disabled={busy} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <p className="mb-4 text-xs text-slate-500">Fields marked <span className="text-red-500">*</span> are required.</p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div><label className="block text-sm font-semibold text-slate-700">{singular} Title <span className="text-red-500">*</span>
                <input required autoFocus maxLength={100} value={form.title} placeholder={`Enter ${singular.toLowerCase()} title`} onChange={(event) => update("title", event.target.value)} aria-invalid={!!errors.title} className={inputClass} /></label><ErrorText>{errors.title}</ErrorText></div>
              <div><label className="block text-sm font-semibold text-slate-700">Description <span className="text-red-500">*</span>
                <textarea required maxLength={1000} rows={3} value={form.description} placeholder={`Describe the ${singular.toLowerCase()} and its benefits`} onChange={(event) => update("description", event.target.value)} aria-invalid={!!errors.description} className={inputClass} /></label><ErrorText>{errors.description}</ErrorText></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="block text-sm font-semibold text-slate-700">{isPackage ? "Package Price" : "Price"} (LKR) <span className="text-red-500">*</span>
                  <input required type="number" min="0.01" step="0.01" value={form.price} placeholder="Enter price" onChange={(event) => update("price", event.target.value)} aria-invalid={!!errors.price} className={inputClass} /></label><ErrorText>{errors.price}</ErrorText></div>
                {isPackage && <div><label className="block text-sm font-semibold text-slate-700">Regular Total Price (LKR) <span className="text-red-500">*</span>
                  <input readOnly value={regularTotal ? regularTotal.toFixed(2) : ""} placeholder="Select services to calculate" className={`${inputClass} bg-slate-50`} /></label><ErrorText>{errors.pricesWithoutDiscounts}</ErrorText></div>}
              </div>
              {isPackage ? <>
                <div className="grid grid-cols-3 gap-3">{[["Package price", money(Number(form.price || 0))], ["Customer saves", money(savings)], ["Discount", `${discount}%`]].map(([label, value]) =>
                  <div key={label} className="rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-blue-900">{value}</p></div>)}</div>
                <div><div className="mb-2 flex justify-between"><p className="text-sm font-semibold text-slate-700">Included Services <span className="text-red-500">*</span></p><span className="text-xs text-slate-500">{form.serviceIds.length} selected</span></div>
                  <div className={`overflow-hidden rounded-2xl border ${errors.serviceIds ? "border-red-300" : "border-slate-200"}`}>
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-3"><Search size={16} className="text-slate-400" /><input aria-label="Search available services" value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder="Search available services..." className="field-control w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" /></div>
                    <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                      {!filteredServices.length && <p className="col-span-full py-8 text-center text-sm text-slate-500">No services found.</p>}
                      {filteredServices.map((service) => {
                        const selected = form.serviceIds.includes(service.id);
                        return <button key={service.id} type="button" aria-pressed={selected} disabled={!service.isActive && !selected}
                          onClick={() => update("serviceIds", selected ? form.serviceIds.filter((id) => id !== service.id) : [...form.serviceIds, service.id])}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50 ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-blue-200"}`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? "border-blue-900 bg-blue-900 text-white" : "border-slate-300"}`}>{selected && <Check size={13} />}</span>
                          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{service.title}</span><span className="block text-xs text-slate-500">{money(service.price)}{!service.isActive && " · Inactive"}</span></span>
                        </button>;
                      })}
                    </div>
                  </div><ErrorText>{errors.serviceIds}</ErrorText>
                </div>
              </> : <div>
                <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-700">Features <span className="text-red-500">*</span></p><p className="mt-1 text-xs text-slate-500">Add between 1 and 5 service features.</p></div>
                  <button type="button" disabled={form.features.length >= 5} onClick={() => update("features", [...form.features, ""])} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 disabled:opacity-40"><Plus size={14} />Add Feature</button></div>
                <div className="space-y-2.5">{form.features.map((feature, index) => <div key={index} className="flex items-center gap-2">
                  <input aria-label={`Feature ${index + 1}`} maxLength={100} value={feature} placeholder={`Enter feature ${index + 1}`} onChange={(event) => update("features", form.features.map((value, i) => i === index ? event.target.value : value))} className={inputClass} />
                  <button type="button" aria-label={`Remove feature ${index + 1}`} disabled={form.features.length <= 1} onClick={() => update("features", form.features.filter((_, i) => i !== index))} className="mt-1.5 rounded-xl border border-red-200 p-3 text-red-600 disabled:opacity-30"><Trash2 size={17} /></button>
                </div>)}</div><ErrorText>{errors.features}</ErrorText>
              </div>}
            </div>
            <div className="space-y-5">
              <div><p className="mb-1.5 text-sm font-semibold text-slate-700">{singular} Image {!editing && <span className="text-red-500">*</span>}</p>
                <input ref={fileInput} type="file" aria-label={`${singular} image`} accept="image/png,image/jpeg,image/jpg,image/webp" className="sr-only" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
                <div onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
                  onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
                  className={`overflow-hidden rounded-2xl border-2 border-dashed transition ${dragging ? "border-blue-500 bg-blue-50" : imageError || errors.image ? "border-red-300 bg-red-50/30" : "border-slate-300 bg-slate-50"}`}>
                  {imageSource ? <><img src={imageSource} alt={`${singular} preview`} className="h-60 w-full object-cover" />
                    <div className="space-y-2 bg-white p-3"><p className="truncate text-xs text-slate-500">{image?.name || "Current image"}</p>
                      <div className="flex gap-2"><button type="button" onClick={() => fileInput.current?.click()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><UploadCloud size={15} />Replace</button>
                        {image && <button type="button" onClick={() => { onImage(null); setImageError(""); }} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">{existingImage ? "Undo" : "Remove"}</button>}</div>
                      <p className="text-xs text-slate-400">You can also drop a replacement image here.</p></div></>
                    : <div className="flex min-h-60 flex-col items-center justify-center p-5 text-center"><div className="mb-3 rounded-2xl bg-blue-100 p-3 text-blue-900"><ImagePlus size={24} /></div>
                      <p className="text-sm font-semibold text-slate-800">Drag and drop image</p><p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPG, JPEG or WEBP<br />Maximum size 5 MB</p>
                      <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white">Browse Image</button></div>}
                </div><ErrorText>{imageError || errors.image}</ErrorText>
                {editing && !image && <p className="mt-2 text-xs text-slate-500">The existing image is kept when you save.</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-slate-800">{singular} Status</p><p className="mt-1 text-xs leading-5 text-slate-500">Inactive {isPackage ? "packages" : "services"} will not be available to customers.</p></div>
                <button type="button" role="switch" aria-label={`${singular} active`} aria-checked={form.isActive} onClick={() => update("isActive", !form.isActive)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.isActive ? "bg-blue-900" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${form.isActive ? "left-6" : "left-1"}`} /></button></div>
                <p className="mt-2 text-xs font-semibold text-slate-600">{form.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>
        </fieldset>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin" /> : editing ? <Check size={17} /> : <Plus size={17} />}{busy ? "Saving" : editing ? "Save Changes" : `Add ${singular}`}</button>
        </div>
      </form>
    </div>, document.body,
  );
}
