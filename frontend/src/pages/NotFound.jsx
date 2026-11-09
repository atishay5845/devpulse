import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
export default function NotFound() { return <div className="not-found"><div className="not-found-icon"><SearchX size={27}/></div><div className="eyebrow">404 · NOT FOUND</div><h1>This page drifted off the grid.</h1><p>The page you're looking for doesn't exist or may have moved.</p><Link className="btn btn-primary" to="/dashboard"><ArrowLeft size={16}/> Back to overview</Link></div>; }
