interface KccLogoProps {
  className?: string;
}

export function KccLogo({ className = '' }: KccLogoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}favicon.png`}
      alt="Kinabalu Climbing Club (KCC)"
      className={`kcc-logo ${className}`}
    />
  );
}

export function KccFooter() {
  return (
    <footer className="kcc-brand-footer" aria-label="System creator">
      Powered by <span>ITLegend</span>
    </footer>
  );
}
