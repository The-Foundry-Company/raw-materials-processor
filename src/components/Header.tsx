export default function Header() {
  return (
    <header className="processor-header text-foundry-dark">
      <svg
        role="img"
        aria-label="Foundry Company"
        width="188.55"
        height="64"
        viewBox="0 0 274 93"
        className="block shrink-0"
      >
        <use href="/logo_wordmark.svg#wordmark" />
      </svg>
      <h1 className="processor-title whitespace-nowrap">
        <span className="block font-display font-extrabold tracking-tight leading-none">
          RAW MATERIALS
        </span>{' '}
        <span className="processor-subtitle block mt-1 font-mono font-medium leading-[1.1]">
          PROCESSOR
        </span>
      </h1>
    </header>
  );
}
