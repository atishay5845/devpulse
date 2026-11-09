import { Check, AlertTriangle, Clock3, CircleDashed } from 'lucide-react';
import { statusTone, titleCase } from '../utils/format';

export default function StatusBadge({ status, children }) {
  const value = status || children || 'UNKNOWN';
  const tone = statusTone(value);
  const Icon = tone === 'success' ? Check : tone === 'danger' ? AlertTriangle : tone === 'warning' ? Clock3 : CircleDashed;
  return <span className={`status-badge status-${tone}`}><Icon size={12}/>{titleCase(value)}</span>;
}
