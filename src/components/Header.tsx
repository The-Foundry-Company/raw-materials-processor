import PretextBlock from './ui/PretextBlock';
import { fontShorthand, lineHeightPx } from '../lib/pretext';

export default function Header() {
  return (
    <header className="flex items-center gap-4 mb-8">
      <img
        src="/logo_wordmark.svg"
        alt="Foundry Company"
        className="h-16"
      />
      <div>
        <PretextBlock
          as="h1"
          text="RAW MATERIALS"
          font={fontShorthand(30, 'sans', 900)}
          lineHeight={lineHeightPx(30, 'tight')}
          className="text-2xl sm:text-3xl font-black text-foundry-dark tracking-tight leading-none"
        >
          RAW MATERIALS
        </PretextBlock>
        <PretextBlock
          as="h2"
          text="PROCESSOR"
          font={fontShorthand(20, 'sans', 700)}
          lineHeight={lineHeightPx(20, 'tight')}
          className="text-lg sm:text-xl font-bold text-foundry-dark/60 tracking-widest leading-none mt-1"
        >
          PROCESSOR
        </PretextBlock>
      </div>
    </header>
  );
}
