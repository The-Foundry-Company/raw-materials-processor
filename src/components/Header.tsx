export default function Header() {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-8">
      <svg
        role="img"
        aria-label="Foundry Company"
        width="242"
        height="82"
        viewBox="0 0 242 82"
        className="shrink-0"
      >
        <image href="/foundry-header-dither.png" width="242" height="82" imageRendering="pixelated" />
        <svg x="38" y="6" width="188.55" height="64" viewBox="0 0 274 93">
          <use href="/logo_wordmark.svg#wordmark" />
        </svg>
      </svg>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foundry-dark tracking-tight leading-none whitespace-nowrap">
          RAW MATERIALS
        </h1>
        <h2 className="text-lg sm:text-xl font-bold text-foundry-dark/60 tracking-widest leading-none">
          PROCESSOR
        </h2>
      </div>
    </header>
  );
}
