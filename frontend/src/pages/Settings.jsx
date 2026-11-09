import { useEffect, useState } from 'react';
import { Check, KeyRound, LogOut, Mail, Shield, UserRound } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PageHeading } from '../components/UI';

export default function Settings() {
  const { user, refreshUser, logout } = useAuth(); const toast = useToast();
  const [form, setForm] = useState({ first_name: '', last_name: '' }); const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ first_name: user?.first_name || '', last_name: user?.last_name || '' }); }, [user]);
  async function submit(event) { event.preventDefault(); setSaving(true); try { await authApi.updateMe(form); await refreshUser(); toast('Profile updated.'); } catch (err) { toast(errorMessage(err), 'error'); } finally { setSaving(false); } }
  return <div className="page-stack"><PageHeading eyebrow="YOUR WORKSPACE, YOUR WAY" title="Settings" subtitle="Manage your profile and session preferences."/>
    <div className="settings-layout"><aside className="settings-nav"><a className="settings-nav-active" href="#profile"><UserRound size={16}/> Profile</a><a href="#security"><Shield size={16}/> Account & security</a></aside><div className="settings-content">
      <section className="panel settings-panel" id="profile"><div className="settings-panel-heading"><div className="settings-avatar"><UserRound size={22}/></div><div><h3>Personal profile</h3><p>Update the name associated with your DevPulse account.</p></div></div><form className="settings-form" onSubmit={submit}><div className="form-grid-2"><Field label="First name"><input className="input" maxLength={150} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name"/></Field><Field label="Last name"><input className="input" maxLength={150} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name"/></Field></div><Field label="Username"><input className="input input-readonly" value={user?.username || ''} readOnly/></Field><Field label="Email address"><div className="input-icon-wrap"><Mail size={16}/><input className="input input-readonly" value={user?.email || ''} readOnly/></div><span className="field-hint">Email and username are read-only in the current backend API.</span></Field><div className="settings-save"><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : <><Check size={16}/> Save profile</>}</button></div></form></section>
      <section className="panel settings-panel" id="security"><div className="settings-panel-heading"><div className="settings-avatar security-avatar"><KeyRound size={21}/></div><div><h3>Account & security</h3><p>Your account is protected with JWT-based authentication.</p></div></div><div className="security-row"><div><strong>Signed in as</strong><span>{user?.email || user?.username}</span></div><span className="security-pill"><Shield size={13}/> Authenticated</span></div><div className="security-row"><div><strong>Session storage</strong><span>Tokens are kept in this browser session.</span></div><span className="muted-text">Session only</span></div><div className="logout-row"><div><strong>Sign out of DevPulse</strong><span>You'll need to sign in again to access your workspace.</span></div><button className="btn btn-danger-soft" onClick={logout}><LogOut size={15}/> Sign out</button></div></section>
    </div></div>
  </div>;
}
