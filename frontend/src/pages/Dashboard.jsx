import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, ArrowUpRight, Clock3, FolderKanban, Globe2, Plus, RefreshCw, ShieldAlert, Timer, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi, incidentsApi, monitorsApi, projectsApi } from '../api/endpoints';
import { unwrapList, errorMessage, fetchAllPages } from '../api/client';
import { useToast } from '../context/ToastContext';
import { duration, shortDate, timeAgo } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorState, LoadingState, PageHeading, StatCard } from '../components/UI';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [overviewRes, monitorRows, projectRows, incidentRows] = await Promise.all([
        analyticsApi.overview(), fetchAllPages(() => monitorsApi.list()), fetchAllPages(() => projectsApi.list()), fetchAllPages(() => incidentsApi.list()),
      ]);
      setOverview(overviewRes.data);
      setMonitors(monitorRows);
      setProjects(projectRows);
      setIncidents(incidentRows.filter((item) => item.status !== 'RESOLVED').slice(0, 4));
      const chartMonitor = monitorRows.find((item) => item.is_active && item.last_checked_at) || monitorRows[0];
      if (chartMonitor) {
        const checksResponse = await monitorsApi.checks(chartMonitor.id);
        setChartData(unwrapList(checksResponse.data).slice(0, 14).reverse().map((item) => ({
          time: new Date(item.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          response: item.response_time_ms === null ? null : Number(item.response_time_ms),
          status: item.status,
        })));
      } else setChartData([]);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const healthPercent = useMemo(() => {
    if (!overview?.total) return null;
    return Math.round((overview.up / overview.total) * 100);
  }, [overview]);

  const runCheck = async (monitor) => {
    setChecking(monitor.id);
    try { await monitorsApi.checkNow(monitor.id); toast('Health check completed.'); await load(); }
    catch (err) { toast(errorMessage(err), 'error'); }
    finally { setChecking(null); }
  };

  if (loading) return <LoadingState/>;
  if (error && !overview) return <ErrorState message={error} onRetry={load}/>;

  return <div className="page-stack">
    <PageHeading eyebrow="YOUR MONITORING SNAPSHOT" title="Good to see you." subtitle="Here's what's happening across your monitored services." action="Add monitor" actionLabel={projects.length ? "Add monitor" : "Create your first project"} actionIcon={projects.length ? Plus : FolderKanban} onAction={() => navigate(projects.length ? '/monitors?new=1' : '/projects?new=1')}/>
    {error && <ErrorState message={error} onRetry={load}/>}
    <div className="dashboard-banner"><div className="banner-orb orb-one"/><div className="banner-orb orb-two"/><div className="banner-content"><div className="banner-icon"><Activity size={20}/></div><div><div className="banner-kicker">WORKSPACE HEALTH</div><h2>{overview?.total ? (overview.down > 0 ? 'A service needs your attention.' : overview.unknown > 0 ? 'Your services are warming up.' : 'Everything is running smoothly.') : 'Your monitoring starts here.'}</h2><p>{overview?.total ? `${overview.up} of ${overview.total} monitored services are currently operational.` : 'Add your first website or API and DevPulse will keep watch around the clock.'}</p></div></div><div className="banner-right">{overview?.total ? <div className="health-ring" style={{ '--health': `${healthPercent}%` }}><div><strong>{healthPercent}%</strong><span>UP</span></div></div> : <div className="banner-empty-icon"><Zap size={25}/></div>}</div></div>
    <div className="stats-grid">
      <StatCard label="Total monitors" value={overview?.total ?? 0} detail={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'} in your workspace`} icon={Globe2} tone="blue"/>
      <StatCard label="Operational" value={overview?.up ?? 0} detail="Passing latest health check" icon={Activity} tone="green"/>
      <StatCard label="Experiencing issues" value={overview?.down ?? 0} detail="Services currently down" icon={ShieldAlert} tone="rose"/>
      <StatCard label="Active incidents" value={overview?.active_incidents ?? 0} detail="Open or acknowledged" icon={Clock3} tone="amber"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel panel-chart"><div className="panel-heading"><div><div className="section-kicker">PERFORMANCE</div><h3>Response time</h3><p>{chartData.length ? 'Latest recorded checks for your most recently active monitor.' : 'Your response-time trend will appear after the first check.'}</p></div><Link className="text-link" to="/analytics">View analytics <ArrowUpRight size={15}/></Link></div>
        {chartData.length ? <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}><defs><linearGradient id="responseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6474f4" stopOpacity={0.22}/><stop offset="100%" stopColor="#6474f4" stopOpacity={0.015}/></linearGradient></defs><CartesianGrid stroke="#edf0f5" vertical={false}/><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }} unit="ms"/><Tooltip contentStyle={{ border: '1px solid #edf0f5', borderRadius: 12, boxShadow: '0 10px 30px rgba(16,24,40,.08)' }} formatter={(value) => [`${Number(value).toFixed(0)} ms`, 'Response']}/><Area type="monotone" dataKey="response" stroke="#6574f5" strokeWidth={2.5} fill="url(#responseFill)" connectNulls dot={{ r: 3, fill: '#fff', stroke: '#6574f5', strokeWidth: 2 }} activeDot={{ r: 5 }}/></AreaChart></ResponsiveContainer></div> : <div className="chart-empty"><div className="chart-empty-wave"><Activity size={24}/></div><strong>No performance data yet</strong><span>Run a check on a monitor to start building your timeline.</span><Link to="/monitors" className="text-link">Explore monitors <ArrowRight size={14}/></Link></div>}
        <div className="chart-foot"><span><i className="legend-dot"/> Response time</span><span><Timer size={13}/> Updates as checks are recorded</span></div>
      </section>
      <section className="panel incident-panel"><div className="panel-heading"><div><div className="section-kicker">NEEDS ATTENTION</div><h3>Active incidents</h3><p>Issues that may need a closer look.</p></div><Link className="icon-link" to="/incidents"><ArrowUpRight size={17}/></Link></div>
        {incidents.length ? <div className="incident-list">{incidents.map((incident) => <Link to={`/incidents/${incident.id}`} className="incident-item" key={incident.id}><span className="incident-mark"><ShieldAlert size={16}/></span><span className="incident-copy"><strong>{incident.title}</strong><small>{incident.monitor_name} · {timeAgo(incident.started_at)}</small></span><StatusBadge status={incident.status}/></Link>)}</div> : <div className="compact-empty"><span className="compact-empty-icon"><ShieldAlert size={18}/></span><strong>All clear for now</strong><p>No active incidents. We'll surface issues here as soon as they're detected.</p></div>}
        <Link to="/incidents" className="panel-bottom-link">View incident history <ArrowRight size={14}/></Link>
      </section>
    </div>
    <section className="panel"><div className="panel-heading"><div><div className="section-kicker">YOUR SERVICES</div><h3>Monitors</h3><p>A quick pulse check across your websites and APIs.</p></div><Link to="/monitors" className="text-link">All monitors <ArrowRight size={14}/></Link></div>
      {monitors.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Monitor</th><th>Project</th><th>Status</th><th>Last checked</th><th>Interval</th><th></th></tr></thead><tbody>{monitors.slice(0, 6).map((monitor) => <tr key={monitor.id}><td><Link className="monitor-cell" to={`/monitors/${monitor.id}`}><span className="monitor-favicon"><Globe2 size={16}/></span><span><strong>{monitor.name}</strong><small>{monitor.url}</small></span></Link></td><td><span className="muted-text">{projects.find((project) => project.id === monitor.project)?.name || `Project #${monitor.project}`}</span></td><td><StatusBadge status={!monitor.is_active ? 'PAUSED' : monitor.status}/></td><td><span className="muted-text">{timeAgo(monitor.last_checked_at)}</span></td><td><span className="muted-text">{monitor.check_interval / 60} min</span></td><td><button className="table-action" disabled={checking === monitor.id || !monitor.is_active} onClick={() => runCheck(monitor)} title="Run check now"><RefreshCw size={15} className={checking === monitor.id ? 'spin' : ''}/></button></td></tr>)}</tbody></table></div> : <EmptyState icon={Globe2} title="No monitors yet" description="Add a website or API endpoint. DevPulse will start checking its health on your schedule." action={projects.length ? "Add your first monitor" : "Create your first project"} onAction={() => navigate(projects.length ? '/monitors?new=1' : '/projects?new=1')}/>}</section>
    <div className="bottom-note"><span><Zap size={14}/> DevPulse is keeping an eye on things.</span><span>Monitoring data is based on recorded health checks.</span></div>
  </div>;
}
