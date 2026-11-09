import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FolderKanban, MoreHorizontal, Pencil, Plus, Trash2, ArrowUpRight, Globe2 } from 'lucide-react';
import { projectsApi, monitorsApi } from '../api/endpoints';
import { errorMessage, fetchAllPages } from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { EmptyState, Field, LoadingState, PageHeading } from '../components/UI';
import { dateTime } from '../utils/format';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast(); const location = useLocation(); const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [projectRows, monitorRows] = await Promise.all([fetchAllPages(() => projectsApi.list()), fetchAllPages(() => monitorsApi.list())]);
      setProjects(projectRows); setMonitors(monitorRows);
    } catch (err) { toast(errorMessage(err), 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (new URLSearchParams(location.search).get('new') === '1') { openCreate(); navigate('/projects', { replace: true }); } }, [location.search]);
  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModal(true); };
  const openEdit = (project) => { setEditing(project); setForm({ name: project.name, description: project.description || '' }); setModal(true); };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      if (editing) await projectsApi.update(editing.id, form); else await projectsApi.create(form);
      toast(editing ? 'Project updated.' : 'Project created.'); setModal(false); await load();
    } catch (err) { toast(errorMessage(err), 'error'); }
    finally { setSaving(false); }
  };
  const remove = async (project) => {
    if (!window.confirm(`Delete “${project.name}”? Its monitors, incidents and status page will also be deleted.`)) return;
    try { await projectsApi.remove(project.id); toast('Project deleted.'); await load(); }
    catch (err) { toast(errorMessage(err), 'error'); }
  };

  return <div className="page-stack"><PageHeading eyebrow="ORGANIZE YOUR SERVICES" title="Projects" subtitle="Keep related websites, APIs and environments organized in one place." action="New project" onAction={openCreate}/>
    <div className="inline-summary"><div><span className="summary-number">{projects.length}</span><span className="summary-label">Total projects</span></div><div className="summary-divider"/><div><span className="summary-number">{monitors.length}</span><span className="summary-label">Monitored services</span></div><div className="summary-right"><span className="summary-dot"/> Scoped to your account</div></div>
    {loading ? <LoadingState label="Loading projects…"/> : projects.length ? <div className="project-grid">{projects.map((project, index) => { const count = monitors.filter((item) => item.project === project.id).length; const up = monitors.filter((item) => item.project === project.id && item.status === 'UP').length; const down = monitors.filter((item) => item.project === project.id && item.status === 'DOWN').length; return <article className="project-card" key={project.id}><div className="project-card-top"><div className={`project-icon project-icon-${index % 4}`}><FolderKanban size={20}/></div><div className="project-menu"><button className="icon-button" onClick={() => openEdit(project)} title="Edit project"><Pencil size={15}/></button><button className="icon-button danger-hover" onClick={() => remove(project)} title="Delete project"><Trash2 size={15}/></button></div></div><h3>{project.name}</h3><p className="project-description">{project.description || 'No description added yet.'}</p><div className="project-card-metrics"><div><strong>{count}</strong><span>Monitors</span></div><div><strong className="text-green">{up}</strong><span>Operational</span></div><div><strong className={down ? 'text-red' : ''}>{down}</strong><span>Down</span></div></div><div className="project-card-foot"><span><Globe2 size={14}/> Created {dateTime(project.created_at).split(' · ')[0]}</span><span className="project-id">#{project.id}</span></div></article>; })}<button className="project-add-card" onClick={openCreate}><span><Plus size={22}/></span><strong>Create another project</strong><small>Organize another product or environment</small></button></div> : <EmptyState icon={FolderKanban} title="Start with a project" description="Projects help you group monitors by product, environment or team. Create one to get your workspace organized." action="Create a project" onAction={openCreate}/>}
    <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit project' : 'Create a project'} description="Give this workspace a clear name so your monitors stay organized.">
      <form className="form-stack" onSubmit={submit}><Field label="Project name"><input className="input" required maxLength={120} placeholder="e.g. ShopKart Production" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></Field><Field label="Description" hint="Optional · Add a little context for this project."><textarea className="input textarea" rows="3" placeholder="What does this project monitor?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></Field><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}</button></div></form>
    </Modal>
  </div>;
}
