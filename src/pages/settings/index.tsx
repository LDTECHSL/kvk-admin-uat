import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, ShieldCheck, UserRound, LockKeyhole } from 'lucide-react';
import Alert, { type AlertVariant } from '@/components/ui/alert';
import { changePassword } from '@/services/auth-api';
import { modules } from '@/lib/navigation';
export default function SettingsPage() {
  const admin = JSON.parse(localStorage.getItem('admin') || 'null');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ variant: AlertVariant; title: string; description: string } | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setAlert({ variant: 'error', title: 'Passwords do not match', description: 'Enter the same new password in both fields.' }); return; }
    setLoading(true);
    try {
      await changePassword({ userId: admin.userId, userName: admin.userName, currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setAlert({ variant: 'success', title: 'Password updated', description: 'Your new password is ready to use.' });
    } catch (error) {
      setAlert({ variant: 'error', title: 'Unable to update password', description: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Please check your current password and try again.' });
    } finally { setLoading(false); }
  };
  return <div className="page-container">
    {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
    <div className="mb-8"><p className="eyebrow">YOUR WORKSPACE</p><h1 className="page-heading">Account settings</h1><p className="mt-2 text-sm text-slate-500">Your profile, workspace access and sign-in details.</p></div>
    <div className="settings-grid">
      <section className="surface-panel profile-panel"><div className="profile-banner" /><div className="profile-panel-body"><div className="profile-avatar">{admin?.firstName?.charAt(0)}{admin?.lastName?.charAt(0)}</div><h2>{admin?.firstName} {admin?.lastName}</h2><p>{admin?.email}</p><span className="profile-role"><ShieldCheck size={12} />Workspace administrator</span><div className="profile-details"><span><UserRound size={15} />Username<strong>{admin?.userName}</strong></span><span><ShieldCheck size={15} />Module access<strong>All modules</strong></span></div><div className="profile-module-list">{modules.map(module => <span key={module.path}><module.icon size={13} />{module.label}</span>)}</div><p className="profile-note">Contact your administrator to update your account information.</p></div></section>
      <section className="surface-panel security-panel"><div className="security-heading"><span><LockKeyhole size={20} /></span><div><h2>Password & security</h2><p>Keep your workspace access secure.</p></div></div><form onSubmit={submit} aria-busy={loading}>
        <div className="login-field"><label htmlFor="current-password">Current password</label><div><input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} disabled={loading} /></div></div>
        <div className="login-field"><label htmlFor="new-password">New password</label><div><input id="new-password" type="password" autoComplete="new-password" required value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={loading} /></div></div>
        <div className="login-field"><label htmlFor="confirm-password">Confirm new password</label><div><input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={loading} /></div></div>
        <div className="security-actions"><p>Choose a password you do not use elsewhere.</p><button className="action-primary" type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>{loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}{loading ? 'Updating...' : 'Update password'}</button></div>
      </form></section>
    </div>
  </div>;
}