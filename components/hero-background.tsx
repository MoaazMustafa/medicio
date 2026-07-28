/**
 * Decorative aurora + grid backdrop for the landing hero.
 * Pure CSS animation (see globals.css) — renders on the server, ships no JS.
 */
export function HeroBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
      <div className="hero-grid" />
    </div>
  );
}
