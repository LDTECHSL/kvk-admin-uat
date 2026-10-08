import { useFeedbackState } from "@/lib/use-feedback-state";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";

type Props = {
  image: File | null;
  existingImage?: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
};
export default function ImageDropzone({ image, existingImage, error, disabled, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useFeedbackState<string>("", "error");
  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const source = preview || (existingImage ? existingImage.startsWith("data:") ? existingImage : `data:image/jpeg;base64,${existingImage}` : "");
  const choose = (file?: File) => {
    if (!file || disabled) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setUploadError("Choose a PNG, JPG or WEBP image."); return; }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) { setUploadError("Choose an image between 1 byte and 5 MB."); return; }
    setUploadError(""); onChange(file);
  };
  return <div>
    <input ref={input} type="file" aria-label="Menu item image" className="sr-only" disabled={disabled} accept="image/png,image/jpeg,image/webp"
      onChange={(event) => { choose(event.target.files?.[0]); event.target.value = ""; }} />
    <div onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}
      className={`overflow-hidden rounded-2xl border-2 border-dashed transition ${dragging ? "border-blue-500 bg-blue-50" : error || uploadError ? "border-red-300 bg-red-50/30" : "border-slate-300 bg-slate-50"}`}>
      {source ? <><img src={source} alt="Menu item preview" className="h-60 w-full object-cover" />
        <div className="space-y-2 bg-white p-3"><p className="truncate text-xs text-slate-500">{image?.name || "Current image"}</p>
          <div className="flex gap-2"><button type="button" disabled={disabled} onClick={() => input.current?.click()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 p-2 text-xs font-semibold"><UploadCloud size={15} />Replace Image</button>
            {image && <button type="button" disabled={disabled} onClick={() => { onChange(null); setUploadError(""); }} className="rounded-lg border border-red-200 p-2 text-xs text-red-600">{existingImage ? "Undo" : "Remove"}</button>}</div>
          <p className="text-xs text-slate-400">Drop a replacement image here.</p></div></>
        : <div className="flex min-h-64 flex-col items-center justify-center p-5 text-center"><div className="mb-3 rounded-2xl bg-blue-100 p-3 text-blue-900"><ImagePlus size={24} /></div>
          <p className="text-sm font-semibold text-slate-800">Drag and drop image</p><p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPG or WEBP<br />Maximum size 5 MB</p>
          <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white">Browse Image</button></div>}
    </div>
    {(uploadError || error) && <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{uploadError || error}</p>}
  </div>;
}
