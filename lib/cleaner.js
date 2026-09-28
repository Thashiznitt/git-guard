const fs = require("fs");
const path = require("path");

function getDirSize(dirPath) {
  let total = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return stat.size;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirSize(fullPath);
      } else {
        try {
          total += fs.statSync(fullPath).size;
        } catch {}
      }
    }
  } catch {}
  return total;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  const size = getDirSize(dirPath);
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return size;
  } catch {
    return 0;
  }
}

/**
 * Clean browser recordings and AI inspection screenshots
 */
function cleanRecordings(verbose = true) {
  const homedir = process.env.HOME || process.env.USERPROFILE || "";
  const brainDir = path.join(homedir, ".gemini/antigravity-ide/brain");
  const ideRecordings = path.join(homedir, ".gemini/antigravity-ide/browser_recordings");
  const legacyRecordings = path.join(homedir, ".gemini/antigravity/browser_recordings");

  let clearedBytes = 0;
  let clearedCount = 0;

  if (fs.existsSync(brainDir)) {
    try {
      const sessions = fs.readdirSync(brainDir);
      for (const session of sessions) {
        const tempMedia = path.join(brainDir, session, ".tempmediaStorage");
        if (fs.existsSync(tempMedia)) {
          const files = fs.readdirSync(tempMedia);
          if (files.length > 0) {
            for (const file of files) {
              try {
                const fp = path.join(tempMedia, file);
                clearedBytes += fs.statSync(fp).size;
                fs.unlinkSync(fp);
                clearedCount++;
              } catch {}
            }
            if (verbose) {
              console.log(`  ✓ Cleared AI browser media in session ${session.slice(0, 8)}... (${files.length} items)`);
            }
          }
        }
      }
    } catch {}
  }

  for (const dir of [ideRecordings, legacyRecordings]) {
    if (fs.existsSync(dir)) {
      clearedBytes += removeDir(dir);
      if (verbose) console.log(`  ✓ Cleared recording cache: ${dir}`);
    }
  }

  // Clear local scratch screenshots
  const scratchShot = path.resolve(process.cwd(), "scratch/simulator_screenshot.png");
  if (fs.existsSync(scratchShot)) {
    try {
      clearedBytes += fs.statSync(scratchShot).size;
      fs.unlinkSync(scratchShot);
      clearedCount++;
      if (verbose) console.log("  ✓ Cleared local scratch/simulator_screenshot.png");
    } catch {}
  }

  return { clearedBytes, clearedCount };
}

/**
 * Universal Duplicate node_modules Cleaner
 * In modern hoisted monorepos and workspaces (npm, yarn, pnpm, lerna, turbo),
 * dependencies must live exclusively at the repository root.
 *
 * This function recursively walks the project tree and permanently eliminates
 * all nested duplicate node_modules (e.g. apps/web/node_modules, packages/ui/node_modules),
 * saving gigabytes of disk and preventing React duplicate instance errors.
 */
function cleanDuplicateNodeModules(cwd = process.cwd(), verbose = true) {
  let clearedBytes = 0;
  const cleanedPaths = [];
  const rootNm = path.resolve(cwd, "node_modules");

  function scan(dir, depth = 0) {
    if (depth > 6) return;
    if (!fs.existsSync(dir)) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const fullPath = path.resolve(dir, entry.name);

        // Never touch .git
        if (entry.name === ".git") continue;

        // Skip root node_modules
        if (fullPath === rootNm) continue;

        // Found a duplicate / nested node_modules!
        if (entry.name === "node_modules") {
          const size = getDirSize(fullPath);
          removeDir(fullPath);
          clearedBytes += size;
          const relPath = path.relative(cwd, fullPath);
          cleanedPaths.push(relPath);
          if (verbose) {
            console.log(`  ✓ Removed duplicate nested node_modules: ${relPath} (freed ${formatBytes(size)})`);
          }
          continue;
        }

        scan(fullPath, depth + 1);
      }
    } catch {}
  }

  scan(cwd, 0);

  if (cleanedPaths.length === 0 && verbose) {
    console.log("  ✓ No duplicate node_modules found. Repository tree is clean.");
  }

  return { clearedBytes, cleanedPaths };
}

/**
 * Universal Build & Framework Cache Cleaner
 * Supports: Next.js, Nuxt, SvelteKit, Astro, Vite, Turbo, React Native,
 * Flutter, iOS/Swift, Android, Python, Rust, Java/Gradle, Playwright, Cypress.
 */
function cleanBuildCaches(options = {}) {
  const cwd = options.cwd || process.cwd();
  let totalBytes = 0;
  const cleanedPaths = [];

  const targets = [
    // Web Frameworks
    ".next",
    ".nuxt",
    ".svelte-kit",
    ".astro",
    ".vite",
    ".turbo",
    ".parcel-cache",
    ".output",
    "dist",
    "build",
    "out",

    // TypeScript
    "*.tsbuildinfo",

    // Mobile & Native
    ".expo",
    "android/app/build",
    "android/.gradle",
    "ios/Pods",
    "ios/build",
    ".build",       // Swift SPM
    ".swiftpm",     // Swift SPM
    "DerivedData",  // Xcode

    // Flutter
    ".dart_tool",

    // Python
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",

    // Rust & Go
    "target",

    // Test runner recordings
    "test-results",
    "cypress/videos",
    "cypress/screenshots",

    // Logs & Dumps
    "scratch",
  ];

  function searchAndClean(dir, depth = 0) {
    if (depth > 3) return; // Prevent traversing too deep
    if (!fs.existsSync(dir)) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          if (entry.name.endsWith(".tsbuildinfo") || entry.name.endsWith(".logcat")) {
            const fp = path.join(dir, entry.name);
            try {
              totalBytes += fs.statSync(fp).size;
              fs.unlinkSync(fp);
              cleanedPaths.push(path.relative(cwd, fp));
            } catch {}
          }
          continue;
        }

        if (entry.name === "node_modules" || entry.name === ".git") {
          continue; // Never delete root node_modules or .git during normal clean
        }

        const fullPath = path.join(dir, entry.name);
        if (targets.includes(entry.name)) {
          const freed = removeDir(fullPath);
          if (freed > 0) {
            totalBytes += freed;
            cleanedPaths.push(path.relative(cwd, fullPath));
          }
        } else {
          searchAndClean(fullPath, depth + 1);
        }
      }
    } catch {}
  }

  searchAndClean(cwd);
  return { totalBytes, cleanedPaths };
}

module.exports = {
  cleanRecordings,
  cleanDuplicateNodeModules,
  cleanBuildCaches,
  formatBytes,
};
