import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { KccLogo } from './KccBrand';

interface BackButtonProps {
  label?: string;
  to?: string;
  title?: string;
  accent?: string;
  subtitle?: string;
}

export function BackButton({ label = 'Back to Home', to = '/', title, accent, subtitle }: BackButtonProps) {
  return (
    <div className="kcc-page-toolbar">
      <Link
        to={to}
        className="kcc-back-button inline-flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="sr-only">{label}</span>
      </Link>
      <div className="kcc-page-identity">
        <KccLogo className="h-16 w-auto sm:h-24" />
        {title && (
          <div className="kcc-page-heading">
            <h1><span>{title}</span>{accent && <strong>{accent}</strong>}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
