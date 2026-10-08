import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Search, UserRoundCheck, X } from "lucide-react";
import { assignTrainer, getGymTrainers } from "@/services/gym-members-api";

type Trainer = { id: string; name: string; email: string; specialization: string; membershipStatus: string };
type Member = { id: string; name: string; membershipNumber: string; trainerId: string | null; assignedTrainer: string };
type Props = { member: Member; onClose: () => void; onAssigned: (trainer: Trainer) => void };

export default function AssignTrainerModal({ member, onClose, onAssigned }: Props) {
  const titleId = useId();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedId, setSelectedId] = useState(member.trainerId ?? "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useFeedbackState<string>("", "error");
  useEffect(() => {
    let cancelled = false;
    getGymTrainers().then((data) => {
      const rows = data?.additionalData?.response ?? data?.response ?? data;
      if (!Array.isArray(rows)) throw new Error("Unable to load trainer options");
      if (!cancelled) setTrainers(rows.filter((trainer) => !trainer.isDeleted).map((trainer) => ({
        id: trainer.id, name: `${trainer.firstName ?? ""} ${trainer.lastName ?? ""}`.trim(),
        email: trainer.email ?? "", specialization: trainer.specialization ?? "",
        membershipStatus: trainer.membershipStatus ?? "Unknown",
      })).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch((err) => {
      if (!cancelled) setError(err?.response?.data?.message || err?.message || "Unable to load trainers");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const selected = trainers.find((trainer) => trainer.id === selectedId);
  const filtered = trainers.filter((trainer) => `${trainer.name} ${trainer.email} ${trainer.specialization}`
    .toLowerCase().includes(search.trim().toLowerCase()));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || selected.membershipStatus !== "Active" || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await assignTrainer(member.id, selected.id);
      if (result?.succeeded === false) throw new Error(result.message || "Unable to assign trainer");
      onAssigned(selected);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to assign trainer");
    } finally { setSaving(false); }
  };

  return createPortal(<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
    onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-5">
        <div className="flex items-center gap-3"><UserRoundCheck size={22} className="text-blue-900" /><h2 id={titleId} className="text-lg font-semibold">Assign Trainer</h2></div>
        <button type="button" aria-label="Close assignment" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
        <div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-900">{member.name}</p><p className="text-xs text-slate-500">{member.membershipNumber}</p>
          <p className="mt-2 text-sm text-slate-600">Current trainer: <span className="font-medium">{member.assignedTrainer || "Not assigned"}</span></p></div>
        <p className="text-sm text-slate-500">Each member has one trainer. Selecting a new trainer replaces the current assignment.</p>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><Search size={16} className="text-slate-400" />
          <input aria-label="Search trainers" value={search} onChange={(event) => setSearch(event.target.value)} disabled={saving || loading} placeholder="Search name, email or specialization..." className="field-control min-w-0 flex-1 text-sm outline-none" /></label>
        {loading ? <p className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading trainers...</p>
          : <fieldset disabled={saving} className="min-w-0 space-y-2"><legend className="mb-2 text-sm font-semibold text-slate-700">Choose trainer</legend>
            {!filtered.length && <p className="py-4 text-center text-sm text-slate-500">{trainers.length ? "No trainers match your search." : "No trainers are available for assignment."}</p>}
            {filtered.map((trainer) => <label key={trainer.id} className={`flex items-start gap-3 rounded-xl border p-3 ${trainer.membershipStatus !== "Active" ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : selectedId === trainer.id ? "cursor-pointer border-blue-300 bg-blue-50" : "cursor-pointer border-slate-200 hover:bg-slate-50"}`}>
              <input type="radio" name="trainer" value={trainer.id} disabled={trainer.membershipStatus !== "Active"} checked={selectedId === trainer.id} onChange={() => setSelectedId(trainer.id)} className="mt-1 accent-blue-900" />
              <span className="min-w-0"><span className="block text-sm font-semibold text-slate-800">{trainer.name}</span><span className="block break-all text-xs text-slate-500">{trainer.email}</span>
                {trainer.specialization && <span className="mt-1 block text-xs text-slate-600">{trainer.specialization}</span>}</span>
              <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{trainer.membershipStatus}</span>
            </label>)}
          </fieldset>}
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
        <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading || saving || !selected || selected.membershipStatus !== "Active" || selectedId === member.trainerId} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{saving ? "Saving..." : "Assign Trainer"}</button>
      </div>
    </form>
  </div>, document.body);
}
