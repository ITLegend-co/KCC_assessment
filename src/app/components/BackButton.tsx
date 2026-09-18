import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { KccLogo } from './KccBrand';

interface BackButtonProps {
  label?: string;
}

export function BackButton({ label = 'Back to Home' }: BackButtonProps) {
  return (
    <div className="kcc-page-toolbar">
      <Link
        to="/"
        className="kcc-back-button inline-flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
      <KccLogo className="h-14 w-auto sm:h-16" />
    </div>
  );
}
