import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
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
  activateGame,
  deactivateGame,
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
};

const emptyForm: GameForm = { name: "", description: "" };

export default function GamingGames() {
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [formModal, setFormModal] = useState<{ mode: "create" | "edit"; game?: Game } | null>(
    null,
  );
  const [form, setForm] = useState<GameForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GameForm, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [confirmTarget, setConfirmTarget] = useState<{
    type: "deactivate" | "activate";
    game: Game;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

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
    setForm({ name: game.name, description: game.description });
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

    if (!imageFile && !imagePreview) {
      setImageError("An image is required.");
      valid = false;
    } else {
      setImageError("");
    }

    setFormErrors(errors);
    return valid;
  };

  const handleSave = async () => {
    if (!validateForm() || !formModal) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("Name", form.name.trim());
      formData.append("Description", form.description.trim());
      formData.append("IsActive", formModal.mode === "create" ? "true" : String(formModal.game?.isActive ?? true));
      if (imageFile) formData.append("Image", imageFile);

      if (formModal.mode === "create") {
        await createGame(formData);
      } else if (formModal.game) {
        formData.append("Id", formModal.game.id);
        await updateGame(formData);
      }

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
    if (!confirmTarget) return;

    setActionError("");
    setBusyId(confirmTarget.game.id);

    try {
      if (confirmTarget.type === "deactivate") {
        await deactivateGame(confirmTarget.game.id);
      } else {
        await activateGame(confirmTarget.game.id);
      }
      await loadGames();
    } catch {
      setActionError(
        confirmTarget.type === "deactivate"
          ? "Failed to deactivate game."
          : "Failed to activate game.",
      );
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Games</h1>
            <p className="text-sm text-gray-500 mt-1">Manage the gaming catalog</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search by name or description..."
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 px-3 py-2.5 bg-blue-700 text-white rounded cursor-pointer transition-all duration-300 text-sm hover:-translate-y-0.5 hover:shadow-lg hover:bg-blue-800"
            >
              <Plus size={16} />
              New Game
            </button>
          </div>
        </div>

        {actionError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "active"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setTab("inactive")}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              tab === "inactive"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Inactive
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16 text-sm text-gray-500">
              <Loader2 size={20} className="mr-2 animate-spin text-blue-700" />
              Loading games...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No games found.
            </div>
          ) : (
            filteredGames.map((game) => (
              <div
                key={game.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-gray-50">
                  {game.image ? (
                    <img
                      src={`data:image/png;base64,${game.image}`}
                      alt={game.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ImageOff size={28} className="text-gray-300" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-semibold text-gray-900">{game.name}</h3>
                  {game.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {game.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => openEditModal(game)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                    </button>
                    {game.isActive ? (
                      <button
                        type="button"
                        title="Deactivate"
                        disabled={busyId === game.id}
                        onClick={() => setConfirmTarget({ type: "deactivate", game })}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="Activate"
                        disabled={busyId === game.id}
                        onClick={() => setConfirmTarget({ type: "activate", game })}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {formModal &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeFormModal();
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
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
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={closeFormModal}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {formModal.mode === "create" ? "Create Game" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {confirmTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && busyId !== confirmTarget.game.id) {
                setConfirmTarget(null);
              }
            }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start gap-4 px-6 pt-6">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    confirmTarget.type === "deactivate"
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {confirmTarget.type === "deactivate" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {confirmTarget.type === "deactivate" ? "Deactivate Game" : "Activate Game"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {confirmTarget.type === "deactivate"
                      ? "This game will be hidden from the guest site and cashier booking flow."
                      : "This game will be made available again."}
                  </p>
                </div>
              </div>

              <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{confirmTarget.game.name}</div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  disabled={busyId === confirmTarget.game.id}
                  onClick={() => setConfirmTarget(null)}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busyId === confirmTarget.game.id}
                  onClick={handleConfirmAction}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
                    confirmTarget.type === "deactivate"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {busyId === confirmTarget.game.id && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {confirmTarget.type === "deactivate" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
