# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code. Core domain logic lives in `src/processor/` (`index.ts`, `rules.ts`, `types.ts`), while UI stages are in `src/components/` and download helpers are in `src/utils/`.  
Tests are colocated in `src/processor/__tests__/` (`processor.test.ts`, `extensive.test.ts`, `fake-lists.test.ts`).  
Static assets live in `public/`. Use `sample-json/` for example inputs and `all_blocks_in_mc/` for reference data snapshots.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server for local development.
- `npm run build`: run TypeScript build (`tsc -b`) and generate production output in `dist/`.
- `npm run preview`: serve the built app locally.
- `npm test`: run Vitest in watch mode.
- `npm test -- --run`: run tests once (recommended for PR validation).
- `npm test -- src/processor/__tests__/processor.test.ts`: run a single test file while iterating.

## Coding Style & Naming Conventions
Use TypeScript and React function components. Match existing style: 2-space indentation, semicolons, and single quotes.  
Use `PascalCase` for React components (`InputStage.tsx`), `camelCase` for functions/variables, and `UPPER_SNAKE_CASE` for domain constants (`PROCESSED_BLOCKS`).  
Prefer small, pure functions in `src/processor/`; keep UI state transitions in `App.tsx`.  
No dedicated ESLint/Prettier config is committed, so keep changes consistent with nearby code.

## Testing Guidelines
Vitest is the test framework. Add tests next to processor logic under `src/processor/__tests__/` using `*.test.ts` filenames.  
Cover classification rules, variant resolution ratios, deduplication (`MAX` behavior), and input validation for any logic changes.  
No enforced coverage threshold is configured; maintain or increase coverage for touched code paths.

## Commit & Pull Request Guidelines
Follow Conventional Commit patterns seen in history: `feat: ...`, `docs: ...`, `style(scope): ...`. Keep subjects short and imperative.  
PRs should include: purpose, summary of behavior changes, linked issue (if any), and verification steps run (`npm test -- --run`, `npm run build`).  
For UI changes, include before/after screenshots.

## Security & Configuration Tips
This is a client-side app; do not commit secrets or environment tokens.  
Treat imported JSON as untrusted input and route parsing through existing validation (`validateInput`) before processing.
