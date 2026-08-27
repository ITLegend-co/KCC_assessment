import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

interface BackButtonProps {
  label?: string;
}

export function BackButton({ label = 'Back to Home' }: BackButtonProps) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors shadow-sm hover:shadow-md"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
