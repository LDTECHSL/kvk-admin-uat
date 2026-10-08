import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Users, X } from "lucide-react";

export type AssignedMember = {
  id: string; trainerId: string; name: string; membershipNumber: string;
  email: string; phoneNumber: string; membershipPlanTitle: string; membershipStatus: string;
};
type Props = { trainer: { name: string }; members: AssignedMember[]; onClose: () => void };

export default function AssignedMembersModal({ trainer, members, onClose }: Props) {
  const titleId = useId();
  const [search, setSearch] = useState("");
  const filtered = members.filter((member) =>
    `${member.name} ${member.membershipNumber} ${member.email} ${member.phoneNumber}`
      .toLowerCase().includes(search.trim().toLowerCase()));
  return createPortal(<div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-5">
        <div className="flex items-center gap-3"><Users size={22} className="text-blue-900" /><div><h2 id={titleId} className="text-lg font-semibold">Assigned Members</h2>
          <p className="text-sm text-slate-500">{trainer.name} · {members.length} {members.length === 1 ? "member" : "members"}</p></div></div>
        <button type="button" aria-label="Close assigned members" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="shrink-0 px-5 py-4"><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><Search size={16} className="text-slate-400" />
        <input aria-label="Search assigned members" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, membership no, email or phone..." className="field-control min-w-0 flex-1 text-sm outline-none" /></label></div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-5 pb-5">
        {filtered.length ? <table className="data-table w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500">
          <th className="p-3">MEMBER</th><th className="p-3">MEMBERSHIP NO</th><th className="p-3">PLAN</th><th className="p-3">STATUS</th></tr></thead>
          <tbody>{filtered.map((member) => <tr key={member.id} className="border-b border-slate-100"><td className="p-3 align-top"><p className="font-medium text-slate-900">{member.name}</p>
            <p className="text-xs text-slate-500">{member.email}</p><p className="text-xs text-slate-500">{member.phoneNumber}</p></td>
            <td className="p-3 align-top whitespace-nowrap text-slate-600">{member.membershipNumber}</td><td className="p-3 align-top text-slate-600">{member.membershipPlanTitle || "-"}</td>
            <td className="p-3 align-top text-slate-600">{member.membershipStatus}</td></tr>)}</tbody></table>
          : <p className="py-8 text-center text-sm text-slate-500">{members.length ? "No assigned members match your search." : "No members are assigned to this trainer."}</p>}
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 p-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">Close</button></div>
    </div>
  </div>, document.body);
}
