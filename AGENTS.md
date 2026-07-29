# Agent Guidelines for TransPal-astro

This document provides essential instructions for AI agents working in this repository. Adhere to these guidelines to ensure consistency and quality.

## 🛠 Build, Lint, and Test Commands

- **Development:** `pnpm run dev` (Starts Astro dev server)
- **Build:** `pnpm run build` (Generates search data and builds the project)
- **Type Check:** `pnpm run check` (Runs `astro check` for Astro files and TypeScript)
- **Run All Tests:** `pnpm run test` (Runs Vitest)
- **Run Single Test:** `npx vitest <file-path>` (e.g., `npx vitest src/utils/speeches.test.ts`)
- **Generate Data:** `pnpm run generate-data` (Updates `public/search-data.json` from JSON files in `public/speeches/`)
- **Deploy:** `pnpm run deploy` (Deploys to Cloudflare Workers using Wrangler)

## 🎨 Code Style & Conventions

### 1. General Principles

- **Astro + React:** Use Astro components for static parts and React components (`.tsx`) for interactive elements.
- **Client Directives:** Use `"use client";` at the top of React files intended for client-side use in Astro.
- **Styling:** Use Tailwind CSS v4. Prefer utility classes over custom CSS. Use `@apply` sparingly.
- **Icons:** Use `unplugin-icons` via the `~icons/lucide/` prefix (e.g., `import LucideBot from "~icons/lucide/bot"`).

### 1.1 shadcn/ui (Base UI, `base-rhea`)

The project uses shadcn/ui with the **Base UI** primitive library and the `rhea` preset (see `components.json`). Primitives live in `src/components/ui/`, the `cn()` helper in `src/lib/utils.ts`, and the theme in `src/styles/global.css`.

- **Add components with the CLI:** `pnpm dlx shadcn@latest add <component> -c .` The `-c .` is required — the root `pnpm-workspace.yaml` makes the CLI treat this repo as a monorepo root otherwise.
- **Base UI, not Radix:** use `render={<button />}` for custom trigger elements, **not** `asChild`. Data attributes are Base UI's (`data-panel-open`, `data-starting-style`, `data-ending-style`).
- **⚠️ Rewrite icon imports after every `add`:** registry components import from `lucide-react`, which this project does **not** install. Replace them with `~icons/lucide/*` (e.g. `ArrowDownIcon` → `import LucideArrowDown from "~icons/lucide/arrow-down"`). Never add `lucide-react` back.
- **Use semantic colour tokens only:** `bg-background`, `bg-card`, `bg-muted`, `bg-accent`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`, `text-destructive`, `bg-primary`/`text-primary-foreground`. These flip automatically under the `.dark` class — **never** write a `dark:` variant for a neutral colour.
- **Exception — accents:** `rhea` is a monochrome palette, so `primary` is near-black. Blue (links, info, CTAs), yellow/amber (warnings) and green (success) are kept as raw Tailwind colours on purpose; do not remap them to `primary`. `Avatar.astro`'s per-speaker colour palette is data-driven — leave it alone.
- **`prose-tight`:** the custom `@utility` in `global.css` that collapses typography margins. Use it for markdown rendered inside narrow surfaces (e.g. chat bubbles).

### 2. TypeScript & Types

- **Strict Typing:** Always use TypeScript. Avoid `any`. Use unknown and narrowing where appropriate.
- **Imports:** Use `import type` for type-only imports to improve build performance.
- **Validation:** Use **Zod** for runtime data validation, especially when loading speech JSON files or API responses.
- **Shared Types:** Keep core data structures in `src/types/`. Avoid declaring types inside component files if they are reused.

### 3. Component Architecture

- **Functional Components:** Use functional components with hooks for React. Prefer `export default function ComponentName()`.
- **Animations:** Use **Framer Motion** (`motion/react`) for transitions and interactive UI. Use `AnimatePresence` for exit animations.
- **Naming:**
  - Components: `PascalCase` (e.g., `SpeechContent.astro`, `ChatBot.tsx`).
  - Utils/Hooks: `camelCase` (e.g., `getSpeech.ts`, `useChat`).
  - Test files: `<filename>.test.ts` or `<filename>.test.tsx`.
- **Props:** Define interfaces for component props. Document complex props with comments.

### 4. Error Handling

- Use the central error utility in `src/utils/errorHandler.ts`.
- **Logging:** Log errors with `logError(error, context, severity)`.
- **Context:** Include `component`, `action`, and relevant IDs (e.g., `filename`, `messageId`) in the context object.
- **Severity Levels:** `low`, `medium`, `high`, `critical`.
- **Retry Logic:** Use `retryWithBackoff` for unstable operations like network fetches or file loading.
- **User Feedback:** Use `getUserFriendlyErrorMessage(error)` to provide localized error messages to users.

### 5. Data & Scripts

- **Speeches:** Located in `public/speeches/*.json`. These are source files for speech content.
- **Metadata Generation:** `scripts/generate-data.mjs` extracts metadata from speech files to create `public/search-data.json`.
- **Dynamic Imports:** Use `import.meta.glob` for loading dynamic assets like speeches or avatars at build time.

### 6. Formatting

- Code is formatted using **Prettier**.
- Configuration: 2-space indentation, single quotes (unless JSX), no semi-colons (check `.prettierrc` if exists, otherwise default to project style).
- Astro files use `prettier-plugin-astro`.
- CSS uses `prettier-plugin-tailwindcss` for utility class sorting.

## 📝 Conventional Commits 1.0.0

Commit messages must follow the Conventional Commits specification. It provides an easy set of rules for creating an explicit commit history; which makes it easier to write automated tools on top of. This convention dovetails with SemVer, by describing the features, fixes, and breaking changes made in commit messages.

### Structure

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Technical Requirements

- **Types**:
  - **feat**: Adds a new feature (correlates with SemVer MINOR).
  - **fix**: Patches a bug (correlates with SemVer PATCH).
  - **docs**: Documentation changes.
  - **style**: Changes that do not affect the meaning of the code.
  - **refactor**: Code change that neither fixes a bug nor adds a feature.
  - **perf**: Code change that improves performance.
  - **test**: Adding missing tests or correcting existing tests.
  - **chore**: Changes to the build process or auxiliary tools and libraries.
- **Scope**: An optional noun describing a specific section of the codebase, enclosed in parentheses (e.g., `feat(parser):`).
- **Description**: A short summary of the code changes, following the mandatory colon and space.
- **Body**: Optional text providing additional context. It must begin one blank line after the description.
- **Footer**: Optional metadata following the git trailer convention. It must begin one blank line after the body or description.

### Breaking Changes

Breaking changes correlate with SemVer MAJOR. They are indicated in two ways:

1. **Exclamation Mark (!)**: Appended to the type or scope before the colon (e.g., `feat(api)!: change endpoint`).
2. **Footer Entry**: A footer starting with the uppercase string `BREAKING CHANGE:` followed by a description of the change.

| Element              | Rule                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Case Sensitivity** | Types and scopes are not case-sensitive. `BREAKING CHANGE` must be uppercase in footers.       |
| **Delimiters**       | A colon and a space must follow the type/scope prefix.                                         |
| **Footer Tokens**    | Must use hyphens instead of whitespace (e.g., `See-also:`), except for `BREAKING CHANGE`.      |
| **Blank Lines**      | One blank line is required between the description and body, and between the body and footers. |

## 📂 Project Structure

- `/src/components/`: Reusable UI components (Astro & React).
- `/src/components/ui/`: shadcn/ui primitives (Base UI). Managed by the shadcn CLI — see §1.1 before editing.
- `/src/lib/`: shadcn helpers (`cn()`).
- `/src/layouts/`: Base layout components for pages.
- `/src/pages/`: Astro routing pages.
- `/src/utils/`: Business logic, data fetching, and error handling.
- `/src/types/`: TypeScript definitions and Zod schemas.
- `/src/worker/`: Cloudflare Worker logic for backend features.
- `/public/speeches/`: Source JSON files for speech transcripts.
- `/public/avatars/`: Speaker profile images (referenced by filename).
- `/scripts/`: Build-time scripts for data processing.

## 🧪 Testing Guidelines

- Use **Vitest** for unit and component testing.
- Use **Happy DOM** or **JSDOM** for React component tests.
- Mock external dependencies and large data sets to keep tests fast.
- Run tests before committing significant logic changes.
