export default function Header() {
  return (
    <header className="flex items-center gap-4 mb-8">
      <img
        src="/logo_wordmark.svg"
        alt="Foundry Company"
        className="h-16"
      />
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
