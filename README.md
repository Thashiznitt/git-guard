# 🛡️ @thashiznitt/git-guard

**Universal Git Safety, Monorepo Node Modules Deduplicator, Build Cache Cleaner & Structured Conventional Commit Generator**

Built for high-performance engineering teams working across monorepos, web frameworks, mobile applications (iOS / Android / Flutter), and native backends.

---

## 🌟 Why Git Guard?

1. **🛡️ 10MB Pre-Commit Size Guard**: Automatically blocks large binaries, video dumps, and unintended files from corrupting your Git history, while leaving them safe on your local disk.
2. **🧹 Monorepo `node_modules` Deduplicator**: In monorepos (Turborepo, Nx, npm/yarn/pnpm workspaces), nested child `node_modules` waste gigabytes of disk and cause "Invalid Hook Call" / duplicate library errors. Git Guard hunts down and eliminates duplicate nested modules while keeping root dependencies intact.
3. **✨ Structured Conventional Commits**: Automatically parses staged files across 9 framework domains (Web, Mobile, Backend, Schemas, etc.), computes diff stats (`+lines, -lines`), and creates clean, standardized conventional commits.
4. **🧼 Universal Cache & Recording Cleaner**: Cleans ephemeral Gemini AI browser recordings, screenshots, and build caches across Next.js, Vite, Turbo, Swift SPM, Android Gradle, Xcode, Flutter, Rust, and Python.
5. **⚡ Instant Git Acceleration**: Automatically configures `core.fsmonitor`, `core.untrackedCache`, and `core.preloadindex` for near-instant `git status` on massive repositories.

---

## 🚀 Quick Start

Run instantly in any repository without installation:

```bash
# Generate a structured commit with safety checks
npx @thashiznitt/git-guard commit

# Deduplicate nested node_modules in monorepos
npx @thashiznitt/git-guard dedupe

# Clean temporary AI recordings and build caches
npx @thashiznitt/git-guard clean --builds
```

Or install permanently into your project:

```bash
npm install --save-dev @thashiznitt/git-guard
```

During installation, Git Guard automatically configures:
- Pre-commit hook in `.husky` or `.git/hooks`
- `install-strategy=hoisted` in `.npmrc` to prevent nested module duplication
- `npm run commit`, `npm run dedupe:modules`, and `npm run clean:recordings` scripts in `package.json`

---

## 🛠️ CLI Commands

### 1. `git-guard dedupe`
Scans the entire repository tree for nested `node_modules` folders (e.g. `apps/web/node_modules`, `packages/ui/node_modules`) and safely wipes them, reporting the exact disk space recovered.
```bash
git-guard dedupe
```

### 2. `git-guard commit`
Interactive or automated conventional commit pipeline:
```bash
# Interactive mode (prompts for subject and description)
git-guard commit

# One-liner mode
git-guard commit -m "feat(auth): add biometric face id verification" -d "Integrates local authentication provider and updates wallet token handling."
```

### 3. `git-guard clean`
Cleans browser session recordings, temporary screenshots, and test logs.
```bash
# Basic hygiene (recordings & screenshots)
git-guard clean

# Full build cache purge (Next, Vite, Swift, Android, Python, etc.)
git-guard clean --builds
```

### 4. `git-guard check`
Validates that staged files do not exceed the 10MB limit. Perfect for pre-commit hooks and CI pipelines.
```bash
git-guard check
git-guard check --max-size 15 # Custom 15MB limit
```

---

## 📱 Framework Support

- **Web**: Next.js, Nuxt, SvelteKit, Astro, Vite, Turbo, Parcel
- **Mobile**: React Native, Expo, iOS (Swift SPM, CocoaPods, Xcode DerivedData), Android (Gradle, Kotlin)
- **Backend & Systems**: Node.js, Go, Rust (`target`), Python (`__pycache__`, `.pytest_cache`), Java/Kotlin
- **Testing**: Playwright, Cypress, Jest, Vitest

---

## 📄 License

MIT © [ThaShiznitt](https://github.com/Thashiznitt)
