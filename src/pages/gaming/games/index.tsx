import { notify } from "@/lib/notifications";
import { notifyValidation } from "@/lib/notifications";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Gamepad2,
  RefreshCw,
  X,
  Loader2,
  ImageOff,
  Upload,
  AlertTriangle,
} from "lucide-react";
import {
  getGames,
  createGame,
  updateGame,
  deleteGame,
} from "@/services/gaming-api";

type Game = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  image: string | null;
};

type GameForm = {
  name: string;
  description: string;
  isActive: boolean;
};

const emptyForm: GameForm = { name: "", description: "", isActive: true };

export default function GamingGames() {
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useFeedbackState<string>("", "error");
  const [searchTerm, setSearchTerm] = useState("");

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; game?: Game } | null>(
    null,
  );
  const [form, setForm] = useState<GameForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GameForm, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useFeedbackState<string>("", "error");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useFeedbackState<string>("", "error");

  const [confirmTarget, setConfirmTarget] = useState<{
    game: Game;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useFeedbackState<string>("", "error");

  useEffect(() => {
    loadGames();
  }, [tab]);

  const loadGames = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getGames(tab === "active");

      const rows =
        response?.additionalData?.response ?? response?.response ?? response ?? [];

      const mapped: Game[] = Array.isArray(rows)
        ? rows.map((game: any) => ({
            id: game.id,
            name: game.name ?? "",
            description: game.description ?? "",
            isActive: !!game.isActive,
            image: game.image || null,
          }))
        : [];

      setGames(mapped);
    } catch {
      setGames([]);
      setError("Failed to load games.");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredGames = games.filter((game) =>
    [game.name, game.description].join(" ").toLowerCase().includes(normalizedSearchTerm),
  );

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormErrors({});
    setSaveError("");
    resetImageState();
    setFormModal({ mode: "create" });
  };

  const openEditModal = (game: Game) => {
    setForm({ name: game.name, description: game.description, isActive: game.isActive });
    setFormErrors({});
    setSaveError("");
    setImageFile(null);
    setImageError("");
    setImagePreview(game.image ? `data:image/png;base64,${game.image}` : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormModal({ mode: "edit", game });
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setFormModal(null);
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImageError("");
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof GameForm, string>> = {};

    if (!form.name.trim()) errors.name = "Name is required.";

    let valid = Object.keys(errors).length === 0;

    if (formModal?.mode === "create" && !imageFile && !imagePreview) {
      setImageError("An image is required.");
      valid = false;
    } else {
      setImageError("");
    }

    setFormErrors(errors);
    notifyValidation(errors);
    return valid;
  };

  const handleSave = async () => {
    if (isSaving || !validateForm() || !formModal) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("Name", form.name.trim());
      formData.append("Description", form.description.trim());
      formData.append("IsActive", String(form.isActive));
      if (imageFile) formData.append("Image", imageFile);

      if (formModal.mode === "create") {
        const result = await createGame(formData);
        if (result?.succeeded === false) throw new Error(result.message || "Failed to create game.");
      } else if (formModal.game) {
        formData.append("Id", formModal.game.id);
        const result = await updateGame(formData);
        if (result?.succeeded === false) throw new Error(result.message || "Failed to update game.");
      }

      notify.success(`Game ${formModal.mode === "create" ? "created" : "updated"} successfully.`);
      await loadGames();
      setFormModal(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to save game.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || busyId) return;
    setActionError("");
    setBusyId(confirmTarget.game.id);
    try {
      const result = await deleteGame(confirmTarget.game.id);
      if (result?.succeeded === false) throw new Error(result.message || "Failed to delete game.");
      notify.success("Game deleted successfully.");
      await loadGames();
      setConfirmTarget(null);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || "Failed to delete game.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900"><Gamepad2 size={24} /></span>
          <div><h1 className="page-heading">Games</h1><p className="mt-1 text-sm text-slate-500">Manage your gaming catalog and availability.</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" title="Refresh page" onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"><RefreshCw size={18} />Refresh</button>
          <button type="button" onClick={openCreateModal} className="action-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"><Plus size={18} />New Game</button>
        </div>
      </div>
      <div className="surface-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Game status filter">
            {(["active", "inactive"] as const).map((status) => <button key={status} type="button" aria-pressed={tab === status} onClick={() => setTab(status)} className={`h-9 rounded-lg px-4 text-sm font-semibold transition ${tab === status ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{status === "active" ? "Active" : "Inactive"}</button>)}
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-72"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search games" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search games..." className="field-control h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
          </div>
        </div>
        {error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">{tab === "active" ? "Active" : "Inactive"} gaming catalog</caption>
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th scope="col" className="px-6 py-4">Game</th><th scope="col" className="px-6 py-4">Description</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-500"><Loader2 size={20} className="mr-2 inline animate-spin text-blue-700" />Loading games...</td></tr>
                : !filteredGames.length ? <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-500">{error ? "Games could not be loaded. Try refreshing." : "No games found."}</td></tr>
                : filteredGames.map((game) => <tr key={game.id} className="transition hover:bg-blue-50/30">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{game.image ? <img src={`data:image/png;base64,${game.image}`} alt="" className="h-full w-full object-cover" /> : <ImageOff size={20} className="text-slate-400" />}</div><span className="font-semibold text-slate-900">{game.name}</span></div></td>
                  <td className="max-w-sm px-6 py-4"><p className="line-clamp-2 leading-6 text-slate-500" title={game.description}>{game.description || "?"}</p></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${game.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${game.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />{game.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" title="Edit game" aria-label={`Edit ${game.name}`} onClick={() => openEditModal(game)} disabled={busyId === game.id} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"><Pencil size={16} /></button><button type="button" title="Delete game" aria-label={`Delete ${game.name}`} disabled={busyId === game.id} onClick={() => { setActionError(""); setConfirmTarget({ game }); }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button></div></td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">{isLoading ? "Loading catalog" : `${filteredGames.length} ${filteredGames.length === 1 ? "game" : "games"}${normalizedSearchTerm ? " matching your search" : ` ? ${tab === "active" ? "Active" : "Inactive"} catalog`}`}</div>
      </div>

      {formModal &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeFormModal();
            }}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="game-form-title" className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 id="game-form-title" className="text-lg font-semibold text-gray-900">
                    {formModal.mode === "create" ? "New Game" : "Edit Game"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formModal.mode === "create"
                      ? "Add a new game to the catalog."
                      : "Update this game's details."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isSaving}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {saveError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {saveError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <Upload size={20} />
                        <span className="text-xs">Click to upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                  />
                  {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="field-control w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. FIFA 25"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={3}
                    className="field-control w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div><p className="text-sm font-semibold text-slate-700">Game status</p><p className="mt-1 text-xs text-slate-500">{form.isActive ? "Active ? Available for bookings" : "Inactive ? Hidden from new bookings"}</p></div>
                  <button type="button" role="switch" aria-label="Game active" aria-checked={form.isActive} disabled={isSaving} onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))} className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${form.isActive ? "bg-blue-700" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${form.isActive ? "left-6" : "left-1"}`} /></button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={closeFormModal}
                  className="cursor-pointer h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="action-primary inline-flex cursor-pointer items-center gap-2 h-11 rounded-xl bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {formModal.mode === "create" ? "Create Game" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {confirmTarget && createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyId) setConfirmTarget(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-game-title" className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start gap-3 px-6 pt-6"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={20} /></span><div><h2 id="delete-game-title" className="text-lg font-semibold text-slate-900">Delete game</h2><p className="mt-1 text-sm leading-6 text-slate-500">Permanently delete <span className="font-medium text-slate-900">{confirmTarget.game.name}</span>? This cannot be undone.</p></div></div>
            {actionError && <p role="alert" className="mx-6 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" disabled={!!busyId} onClick={() => setConfirmTarget(null)} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button><button type="button" disabled={!!busyId} onClick={handleConfirmAction} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{busyId && <Loader2 size={16} className="animate-spin" />}Delete game</button></div>
          </div>
        </div>, document.body,
      )}
    </div>
  );
}
