import { useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Coffee, Loader2, Plus, X } from "lucide-react";
import ImageDropzone from "@/components/image-dropzone";
import { CATEGORY_OPTIONS, isDrink, type MenuForm, type MenuErrors } from "./form-model";

type Props = {
  form: MenuForm; errors: MenuErrors; error: string; image: File | null;
  existingImage?: string | null; editing: boolean; busy: boolean;
  onChange: (form: MenuForm) => void; onImage: (file: File | null) => void;
  onClose: () => void; onSubmit: (event: FormEvent) => void;
};
const ingredientOptions = ["Coffee", "Espresso", "Milk", "Sugar", "Water", "Ice", "Chocolate", "Vanilla", "Caramel", "Whipped Cream", "Cinnamon", "Honey"];
const fieldClass = "field-control mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
function ErrorText({ value }: { value?: string }) { return value ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{value}</p> : null; }

export default function MenuFormModal({ form, errors, error, image, existingImage, editing, busy, onChange, onImage, onClose, onSubmit }: Props) {
  const titleId = useId();
  const [includeText, setIncludeText] = useState("");
  const drink = isDrink(form.category);
  const update = <K extends keyof MenuForm>(key: K, value: MenuForm[K]) => onChange({ ...form, [key]: value });
  const addInclude = () => {
    const value = includeText.trim();
    if (!value) return;
    update("ingredients", [...new Set([...form.ingredients, value])]); setIncludeText("");
  };
  return createPortal(<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <form onSubmit={onSubmit} noValidate role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-900 p-3 text-white"><Coffee size={21} /></div>
        <div><h2 id={titleId} className="text-xl font-bold text-slate-900">{editing ? "Edit" : "Add"} Café Menu Item</h2><p className="text-sm text-slate-500">Manage menu details, ingredients, pricing and image.</p></div></div>
        <button type="button" aria-label="Close form" disabled={busy} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
      <fieldset disabled={busy} className="min-w-0">
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mb-4 text-xs text-slate-500">Fields marked <span className="text-red-500">*</span> are required.</p>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]"><div className="space-y-5">
          <div><label className="block text-sm font-semibold text-slate-700">Name <span className="text-red-500">*</span><input autoFocus required maxLength={100} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={drink ? "e.g. Cappuccino" : "e.g. English Breakfast"} aria-invalid={!!errors.name} className={fieldClass} /></label><ErrorText value={errors.name} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="block text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span><select value={form.category} onChange={(event) => {
              const category = Number(event.target.value); onChange({ ...form, category, preparationTimeInMinutes: isDrink(category) ? "0" : "", portionSize: isDrink(category) ? "0" : "" });
            }} className={fieldClass}>{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><ErrorText value={errors.category} /></div>
            <div><label className="block text-sm font-semibold text-slate-700">Price (LKR) <span className="text-red-500">*</span><input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} aria-invalid={!!errors.price} placeholder="0.00" className={fieldClass} /></label><ErrorText value={errors.price} /></div>
          </div>
          <label className="block text-sm font-semibold text-slate-700">Description<textarea maxLength={1000} rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe this menu item..." className={fieldClass} /></label>
          <label className="block text-sm font-semibold text-slate-700">Facts<textarea maxLength={500} rows={2} value={form.facts} onChange={(event) => update("facts", event.target.value)} placeholder="Interesting facts about this item..." className={fieldClass} /></label>
          <div><p className="mb-2 text-sm font-semibold text-slate-700">{drink ? "Ingredients" : "Includes"}</p>
            {drink && <div className="mb-3 flex flex-wrap gap-2">{ingredientOptions.map((ingredient) => <button key={ingredient} type="button" aria-pressed={form.ingredients.includes(ingredient)} onClick={() => update("ingredients", form.ingredients.includes(ingredient) ? form.ingredients.filter((value) => value !== ingredient) : [...form.ingredients, ingredient])} className={`rounded-lg border px-3 py-2 text-xs font-medium ${form.ingredients.includes(ingredient) ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-600"}`}>{ingredient}</button>)}</div>}
            <div className="flex items-center gap-2"><input aria-label={drink ? "Add ingredient" : "Add included item"} value={includeText} onChange={(event) => setIncludeText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addInclude(); } }} maxLength={100} placeholder={drink ? "Add another ingredient" : "e.g. Eggs, toast, sausage"} className={fieldClass} />
              <button type="button" onClick={addInclude} className="mt-1.5 inline-flex items-center gap-1 rounded-xl bg-blue-900 px-3 py-3 text-sm text-white"><Plus size={15} />Add</button></div>
            <div className="mt-3 flex flex-wrap gap-2">{form.ingredients.map((value, index) => <span key={`${value}-${index}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-900">{value}<button type="button" aria-label={`Remove ${value}`} onClick={() => update("ingredients", form.ingredients.filter((_, i) => i !== index))}><X size={13} /></button></span>)}</div><ErrorText value={errors.ingredients} />
          </div>
          {!drink && <div className="grid gap-4 sm:grid-cols-2"><div><label className="block text-sm font-semibold text-slate-700">Portion <span className="text-red-500">*</span><select required value={form.portionSize} onChange={(event) => update("portionSize", event.target.value)} className={fieldClass}><option value="">Select portion</option>{[1, 2, 3, 4].map((size) => <option key={size} value={size}>For {size}</option>)}</select></label><ErrorText value={errors.portionSize} /></div>
            <div><label className="block text-sm font-semibold text-slate-700">Preparation Time (minutes) <span className="text-red-500">*</span><input required type="number" min={0} max={60} step={1} value={form.preparationTimeInMinutes} onChange={(event) => update("preparationTimeInMinutes", event.target.value)} placeholder="0–60" className={fieldClass} /></label><ErrorText value={errors.preparationTimeInMinutes} /></div></div>}
        </div><div className="space-y-5"><div><p className="mb-1.5 text-sm font-semibold text-slate-700">Image {(!editing || !existingImage) && <span className="text-red-500">*</span>}</p><ImageDropzone image={image} existingImage={existingImage} error={errors.image} disabled={busy} onChange={onImage} />
          {editing && !image && existingImage && <p className="mt-2 text-xs text-slate-500">The current image is kept unless you choose a replacement.</p>}</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-slate-800">Menu Item Status</p><p className="mt-1 text-xs text-slate-500">Set this item active or inactive.</p></div>
            <button type="button" role="switch" aria-label="Menu item active" aria-checked={form.isActive} onClick={() => update("isActive", !form.isActive)} className={`relative h-7 w-12 shrink-0 rounded-full ${form.isActive ? "bg-blue-900" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${form.isActive ? "left-6" : "left-1"}`} /></button></div><p className="mt-2 text-xs font-semibold text-slate-600">{form.isActive ? "Active" : "Inactive"}</p></div>
        </div></div>
      </fieldset>
      </div>
      <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin" /> : editing ? <Check size={17} /> : <Plus size={17} />}{busy ? "Saving" : editing ? "Save Changes" : "Add Menu Item"}</button></div>
    </form>
  </div>, document.body);
}
