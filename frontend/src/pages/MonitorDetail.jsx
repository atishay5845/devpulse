import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowUpRight, Clock3, ExternalLink, RefreshCw, ShieldAlert, Timer, TrendingUp, Wifi } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsApi, monitorsApi } from '../api/endpoints';
import { unwrapList, errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { dateTime, duration, shortDate, timeAgo, uptimeLabel } from '../utils/format';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState, StatCard } from '../components/UI';

export default function MonitorDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const toast = useToast();
  const [monitor, setMonitor] = useState(null); const [checks, setChecks] = useState([]); const [analytics, setAnalytics] = useState(null); const [period, setPeriod] = useState('7d'); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [checking, setChecking] = useState(false);

  const load = async () => { setLoading(true); setError(''); try { const [m, c, a] = await Promise.all([monitorsApi.get(id), monitorsApi.checks(id), analyticsApi.monitor(id, period)]); setMonitor(m.data); setChecks(unwrapList(c.data)); setAnalytics(a.data); } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [id, period]);
  const chartData = useMemo(() => [...checks].reverse().map((check) => ({ time: new Date(check.checked_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), response: check.response_time_ms == null ? null : Number(check.response_time_ms), status: check.status })), [checks]);

  const runCheck = async () => { setChecking(true); try { await monitorsApi.checkNow(id); toast('Health check completed.'); await load(); } catch (err) { toast(errorMessage(err), 'error'); } finally { setChecking(false); } };
  if (loading) return <LoadingState label="Loading monitor details…"/>;
  if (error || !monitor) return <ErrorState message={error || 'Monitor not found.'} onRetry={load}/>;

  return <div className="page-stack"><div className="back-row"><button className="back-button" onClick={() => navigate('/monitors')}><ArrowLeft size={15}/> All monitors</button><span>/</span><span>{monitor.name}</span></div>
    <div className="detail-heading"><div className="detail-identity"><div className="detail-globe"><Wifi size={23}/></div><div><div className="eyebrow">MONITOR OVERVIEW</div><h1>{monitor.name}</h1><a className="external-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url} <ExternalLink size={13}/></a></div></div><div className="detail-actions"><StatusBadge status={!monitor.is_active ? 'PAUSED' : monitor.status}/><button className="btn btn-secondary" disabled={!monitor.is_active || checking} onClick={runCheck}><RefreshCw size={15} className={checking ? 'spin' : ''}/> Check now</button></div></div>
    <div className="detail-meta-row"><span><span className="meta-dot"/> Project #{monitor.project}</span><span><Clock3 size={14}/> Every {monitor.check_interval / 60} minute{monitor.check_interval === 60 ? '' : 's'}</span><span><Timer size={14}/> {monitor.timeout}s timeout</span><span>Last checked {timeAgo(monitor.last_checked_at)}</span></div>
    <div className="stats-grid detail-stats"><StatCard label="Estimated uptime" value={uptimeLabel(analytics?.uptime_percentage)} detail="Sample-based estimate" icon={TrendingUp} tone="green"/><StatCard label="Average response" value={analytics?.average_response_time_ms == null ? '—' : duration(analytics.average_response_time_ms)} detail="Across recorded checks" icon={Timer} tone="blue"/><StatCard label="Successful checks" value={analytics?.successful ?? 0} detail={`${analytics?.total ?? 0} total checks in period`} icon={Activity} tone="green"/><StatCard label="Failed checks" value={analytics?.failed ?? 0} detail="In selected period" icon={ShieldAlert} tone="rose"/></div>
    <section className="panel"><div className="panel-heading"><div><div className="section-kicker">LATENCY</div><h3>Response time history</h3><p>Each point represents a recorded health check.</p></div><div className="segmented-control">{['24h','7d','30d'].map((key) => <button key={key} className={period === key ? 'segment-active' : ''} onClick={() => setPeriod(key)}>{key}</button>)}</div></div>
      {chartData.length ? <div className="detail-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6375f5" stopOpacity={0.22}/><stop offset="100%" stopColor="#6375f5" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#edf0f5" vertical={false}/><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 10 }} minTickGap={28}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#98a2b3', fontSize: 11 }} unit="ms"/><Tooltip contentStyle={{ border: '1px solid #edf0f5', borderRadius: 12 }} formatter={(value) => [`${Number(value).toFixed(0)} ms`, 'Response']}/><Area type="monotone" dataKey="response" stroke="#6574f5" strokeWidth={2.5} fill="url(#detailFill)" connectNulls dot={false} activeDot={{ r: 5 }}/></AreaChart></ResponsiveContainer></div> : <div className="chart-empty compact"><div className="chart-empty-wave"><Activity size={22}/></div><strong>No checks in this view</strong><span>Run a manual check or wait for the next scheduled check.</span></div>}
      <p className="measurement-note">{analytics?.measurement_note || 'Uptime is estimated from successful checks divided by all recorded checks.'}</p>
    </section>
    <section className="panel"><div className="panel-heading"><div><div className="section-kicker">LATEST ACTIVITY</div><h3>Health check history</h3><p>The latest {checks.length} recorded checks for this monitor.</p></div><span className="history-count">{checks.length} records</span></div>
      {checks.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Result</th><th>HTTP status</th><th>Response time</th><th>Error</th><th>Checked at</th></tr></thead><tbody>{checks.map((check) => <tr key={check.id}><td><StatusBadge status={check.status}/></td><td><span className="muted-text">{check.status_code || '—'}</span></td><td><strong className="table-strong">{duration(check.response_time_ms)}</strong></td><td><span className="error-cell">{check.error_message || '—'}</span></td><td><span className="muted-text">{dateTime(check.checked_at)}</span></td></tr>)}</tbody></table></div> : <div className="table-empty">No health checks recorded yet.</div>}
    </section>
  </div>;
}
