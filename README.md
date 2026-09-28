# git-guard 🛡️

> **Universal Git Safety & Build Cache Cleaner**  
> Prevents bloated commits (>10MB), sweeps away temporary AI recordings & heavy build caches across all frameworks, and generates structured, descriptive conventional commits.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org)

---

## Why Git Guard?

Repositories slow down and machines freeze because of three common problems:
1. **Accidental Giant Commits**: A developer stages an `.apk`, a 30MB log dump, or a bundle cache pack file. Once in Git history, it stays forever and inflates every clone/fetch.
2. **Hidden Cache & Media Accumulation**: Modern web and mobile frameworks produce gigabytes of ephemeral build caches (`.next/`, `.turbo/`, `DerivedData/`, `.build/`, `android/.gradle/`) and AI inspection tools leave behind hundreds of megabytes of video recordings and screenshots.
3. **Vague, Unhelpful Commits**: Commit messages like `"fix"` or `"updates"` don't convey what changed or why.

**Git Guard solves all three automatically across any project and any framework.**

---

## ✨ Features

- 🛑 **10MB Commit Size Guard**: Fails fast in `< 0.05s` if any staged file exceeds 10MB (configurable). Zero data loss: files remain safely on your disk.
- 🧹 **Universal Multi-Framework Cache Cleaner**:
  - **Web**: Next.js, Nuxt, SvelteKit, Astro, Vite, Remix, Turbo, Parcel, Webpack.
  - **Mobile**: React Native, Expo, Flutter, iOS (Pods, build, DerivedData), Android (build, gradle, APKs).
  - **Compiled Languages**: Swift Package Manager (`.build/`), Rust (`target/`), Go (`bin/`), Java/Kotlin (`build/`, `.gradle/`).
  - **Python**: `__pycache__`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`.
  - **AI & Testing Media**: Antigravity/Gemini browser subagent WebP recordings (`~/.gemini/antigravity-ide/brain/*/.tempmediaStorage`), Playwright & Cypress test videos and screenshots.
- 📝 **Structured Conventional Commit Generator**: Auto-inspects staged files, calculates line additions and deletions (+/–), intelligently groups files by domain, and builds a comprehensive commit message.
- ⚡ **Git Native Performance Tuning**: Automatically enables macOS `core.fsmonitor`, `core.untrackedCache`, and `core.preloadindex`.

---

## 🚀 Quick Start

### 1. Zero-Install via npx (Any Project)

In any existing repository, run:

```bash
npx git-guard init
```

This will:
- Install the **10MB Size Guard** into `.husky/pre-commit` or `.git/hooks/pre-commit`.
- Enable Git native file-system monitoring (`fsmonitor`) for instant `git status`.
- Add `commit` and `clean:recordings` scripts to your `package.json`.

---

### 2. Auto-Install via npm (Reusable in Team Projects)

Add `git-guard` to `devDependencies`:

```bash
npm install -D git-guard
```

During `npm install`, the **postinstall** hook automatically configures your repository.

---

## 🛠️ Commands & Usage

### 1. Human-Readable Descriptive Commits
Stage your files and run:
```bash
# Interactive mode (prompts for subject and description):
npm run commit

# Or with arguments:
npm run commit -- -m "feat(auth): add OAuth2 provider" -d "Integrated Google OAuth and user session handler"
```

**Example output generated in Git history:**
```text
feat(auth): add OAuth2 provider

Integrated Google OAuth and user session handler

Files:
Backend & APIs:
  - src/auth/oauth.service.ts (+42, -5)
  - src/auth/oauth.controller.ts (+18, -2)

Web & Frontend:
  - src/components/LoginButton.tsx (+15, -1)

Safety Verification:
- Size Guard: PASSED (all staged files < 10MB)
- Build Hygiene: Clean
```

---

### 2. Clean Ephemeral AI Media & Build Caches

```bash
# Clean temporary AI browser recordings & scratch screenshots:
npx git-guard clean

# Deep clean ALL framework build caches (Next, Vite, Swift, Android, Python, etc.):
npx git-guard clean --builds
```

---

### 3. Check Staged Files (Pre-Commit / CI)

```bash
# Verify no files exceed 10MB:
npx git-guard check

# Custom size limit (e.g. 15MB):
npx git-guard check --max-size 15
```

---

## 📦 Supported Frameworks & Builds

| Ecosystem | Cleaned & Supported Caches | File Categorization |
| :--- | :--- | :--- |
| **Next.js / React / Vite** | `.next`, `.vite`, `dist`, `build`, `.turbo` | Frontend & Web |
| **Nuxt / Vue** | `.nuxt`, `.output`, `dist` | Frontend & Web |
| **Svelte / SvelteKit** | `.svelte-kit`, `build` | Frontend & Web |
| **Astro** | `.astro`, `dist` | Frontend & Web |
| **React Native / Expo** | `.expo`, `android/build`, `ios/build` | Mobile |
| **Flutter** | `.dart_tool`, `build` | Mobile |
| **Swift / iOS** | `.build`, `.swiftpm`, `Pods`, `DerivedData` | Mobile / Native |
| **Android / Kotlin / Java** | `app/build`, `.gradle`, `target` | Mobile / Backend |
| **Node / NestJS / Express** | `dist`, `.cache`, `*.tsbuildinfo` | Backend & APIs |
| **Python / FastAPI / Django** | `__pycache__`, `.pytest_cache`, `.mypy_cache` | Backend & APIs |
| **Rust / Cargo** | `target` | Backend & Native |
| **AI Subagents / Browser Tests** | Gemini recordings, Playwright, Cypress videos | Test Media |

---

## 🔒 Security & Privacy

* **Zero telemetry, zero external network requests.**
* Git Guard runs **100% locally** on your machine.
* Does not collect, upload, or transmit any code, filenames, or metrics.

---

## 📄 License

MIT © [ThaShiznitt](https://github.com/Thashiznitt)
