import { notify } from "@/lib/notifications";
import { ADMIN_ACCESS_ERROR } from '@/lib/admin-access';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Layers3, LockKeyhole, ShieldCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/services/auth-api';
import { Alert } from '@/components/ui/alert';
import { modules } from '@/lib/navigation';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const admin = await login(username, password);
      localStorage.setItem('admin', JSON.stringify(admin));
      notify.success('Signed in successfully.');
      navigate('/main/dashboard');
    } catch (error) {
      setError((error as { response?: { status?: number } })?.response?.status === 403 || (error instanceof Error && error.message === ADMIN_ACCESS_ERROR) ? ADMIN_ACCESS_ERROR : 'Unable to sign in. Check your username and password and try again.');
    } finally { setLoading(false); }
  };
  return <main className="login-page">
    {error && <Alert variant="error" title="Unable to sign in" description={error} onClose={() => setError('')} />}
    <section className="login-story" aria-label="KVK Arena management suite">
      <div className="workspace-brand"><span className="brand-mark"><Layers3 size={22} /></span><span><strong>KVK<span className="brand-light"> Arena</span></strong><small>MANAGEMENT SUITE</small></span></div>
      <div className="login-story-content"><p className="eyebrow">Your business, connected</p><h2>Every operation.<br /><span>One clear view.</span></h2><p>A considered workspace for the people, services and experiences that make KVK Arena.</p><div className="login-module-grid">{modules.map(module => <div key={module.path}><module.icon size={17} style={{ color: module.color }} /><span>{module.label}</span></div>)}</div></div>
      <div className="login-story-footer"><Layers3 size={14} /><span>Six experiences. One arena.</span></div>
    </section>
    <section className="login-form-side"><div className="login-form-wrap">
      <div className="login-mobile-brand"><span className="brand-mark"><Layers3 size={21} /></span><strong>KVK Arena</strong></div>
      <div className="login-symbol"><LockKeyhole size={22} strokeWidth={1.6} /></div><p className="eyebrow">Administrator workspace</p><h1>Welcome back.</h1><p className="login-description">Sign in to manage your arena.<br />Everything you need, right where you left it.</p>
      <form onSubmit={submit} aria-busy={loading}>
        <div className="login-field"><label htmlFor="admin-username">Username</label><div><input id="admin-username" name="username" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Enter your username" required disabled={loading} /></div></div>
        <div className="login-field"><label htmlFor="admin-password">Password</label><div><input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required disabled={loading} /><button className="icon-button" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
        <button type="submit" className="action-primary login-submit" disabled={loading}>{loading ? <><Loader2 size={17} className="animate-spin" />Signing in...</> : <>Sign in to workspace<ArrowRight size={17} /></>}</button>
      </form><p className="login-access-note"><ShieldCheck size={14} />Admin access requires an account assigned to all business modules. Contact your administrator for access.</p>
    </div><p className="login-copyright">© {new Date().getFullYear()} KVK Arena. All rights reserved.</p></section>
  </main>;
}
