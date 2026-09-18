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

export function KccWallDecor() {
  return (
    <div className="kcc-wall-decor" aria-hidden="true">
      <span className="kcc-hold kcc-hold-one" />
      <span className="kcc-hold kcc-hold-two" />
      <span className="kcc-hold kcc-hold-three" />
      <span className="kcc-hold kcc-hold-four" />
      <span className="kcc-hold kcc-hold-five" />
      <span className="kcc-hold kcc-hold-six" />
    </div>
  );
}
