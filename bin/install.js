#!/usr/bin/env node
/**
 * @thashiznitt/git-guard Automatic Hook & Configuration Installer
 *
 * Runs automatically on `npm install` (postinstall) or manually via `npx git-guard init`.
 * Sets up 10MB commit size guard, monorepo node_modules deduplication, npm scripts,
 * and git performance flags.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function run(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

function findProjectRoot() {
  const initCwdKey = ["INIT", "CWD"].join("_");
  if (process.env[initCwdKey] && fs.existsSync(process.env[initCwdKey])) {
    return process.env[initCwdKey];
  }
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, "package.json")) && fs.existsSync(path.join(current, ".git"))) {
      return current;
    }
    current = path.dirname(current);
  }
  return process.cwd();
}

function main() {
  const root = findProjectRoot();
  console.log(`\n🛡️  [Git Guard] Configuring Git safety in: ${root}`);

  const gitDir = path.join(root, ".git");
  if (!fs.existsSync(gitDir)) {
    console.log("  ○ No .git repository detected. Skipping git hook installation.\n");
    return;
  }

  // 1. Install Pre-Commit Size Guard & Node Modules Deduplication Hook
  const guardCode = `# -----------------------------------------------------------------------------
# GUARD: Block files > 10MB & prevent duplicate node_modules
# Installed by @thashiznitt/git-guard
# -----------------------------------------------------------------------------
MAX_SIZE_KB=10240

# 1. Clean any duplicate nested node_modules in subfolders (apps/*/node_modules, packages/*/node_modules)
find apps packages -maxdepth 3 -name node_modules -type d -prune -exec rm -rf {} + 2>/dev/null || true

# 2. Block staged files > 10MB from entering Git history
git diff --cached --name-only --diff-filter=ACM | while IFS= read -r file; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file" | tr -d ' ')
    size_kb=$((size / 1024))
    if [ "$size_kb" -gt "$MAX_SIZE_KB" ]; then
      echo "❌ [Size Guard] Staged file '$file' is $((size_kb / 1024))MB."
      echo "   Files over 10MB must not be committed to Git history."
      echo "   To keep this file on your disk without committing it:"
      echo "     git reset HEAD \"$file\""
      echo "     echo \"$file\" >> .gitignore"
      exit 1
    fi
  fi
done || exit 1
`;

  const huskyDir = path.join(root, ".husky");
  const huskyPreCommit = path.join(huskyDir, "pre-commit");
  const gitHooksDir = path.join(gitDir, "hooks");
  const gitPreCommit = path.join(gitHooksDir, "pre-commit");

  let targetHook = "";
  if (fs.existsSync(huskyDir)) {
    targetHook = huskyPreCommit;
  } else if (fs.existsSync(gitHooksDir)) {
    targetHook = gitPreCommit;
  }

  if (targetHook) {
    let existing = "";
    if (fs.existsSync(targetHook)) {
      existing = fs.readFileSync(targetHook, "utf8");
    }

    if (!existing.includes("Size Guard") && !existing.includes("MAX_SIZE_KB=10240")) {
      const updated = guardCode + "\n" + existing;
      fs.writeFileSync(targetHook, updated, { mode: 0o755 });
      console.log(`  ✅ Installed 10MB Size Guard & Dedupe in: ${path.relative(root, targetHook)}`);
    } else {
      console.log(`  ✓ 10MB Size Guard already active in: ${path.relative(root, targetHook)}`);
    }
  }

  // 2. Configure .npmrc for Hoisting (prevents duplicate child node_modules during npm install)
  const npmrcPath = path.join(root, ".npmrc");
  let npmrcContent = "";
  if (fs.existsSync(npmrcPath)) {
    npmrcContent = fs.readFileSync(npmrcPath, "utf8");
  }
  if (!npmrcContent.includes("install-strategy=hoisted")) {
    npmrcContent += (npmrcContent.endsWith("\n") || npmrcContent === "" ? "" : "\n") + "install-strategy=hoisted\n";
    fs.writeFileSync(npmrcPath, npmrcContent, "utf8");
    console.log(`  ✅ Configured 'install-strategy=hoisted' in .npmrc`);
  }

  // 3. Add npm scripts to host package.json
  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.scripts = pkg.scripts || {};
      let updated = false;

      if (!pkg.scripts["commit"]) {
        pkg.scripts["commit"] = "git-guard commit";
        updated = true;
      }
      if (!pkg.scripts["clean:recordings"]) {
        pkg.scripts["clean:recordings"] = "git-guard clean";
        updated = true;
      }
      if (!pkg.scripts["dedupe:modules"]) {
        pkg.scripts["dedupe:modules"] = "git-guard dedupe";
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
        console.log(`  ✅ Added 'commit', 'dedupe:modules', and 'clean:recordings' scripts to package.json`);
      }
    } catch {}
  }

  // 4. Enable Git performance features locally
  run("git config core.fsmonitor true", root);
  run("git config core.untrackedCache true", root);
  run("git config core.preloadindex true", root);
  console.log(`  ✅ Optimized local Git speed (fsmonitor, untrackedCache, preloadindex enabled)`);

  console.log(`\n🛡️  Git Guard is ready!\n`);
}

main();
