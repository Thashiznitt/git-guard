#!/usr/bin/env node
/**
 * @thashiznitt/git-guard Automatic Hook & Configuration Installer
 *
 * Runs automatically on `npm install` (postinstall) or manually via `npx git-guard init`.
 * Sets up 10MB commit size guard, npm helper scripts, and git performance flags.
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

  // 1. Install Pre-Commit Size Guard Hook
  const guardCode = `# -----------------------------------------------------------------------------
# GUARD: Block files > 10MB from being committed into Git history.
# Installed by git-guard (keeps repo lean & ensures zero data loss)
# -----------------------------------------------------------------------------
MAX_SIZE_KB=10240

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
      console.log(`  ✅ Installed 10MB Size Guard in: ${path.relative(root, targetHook)}`);
    } else {
      console.log(`  ✓ 10MB Size Guard already active in: ${path.relative(root, targetHook)}`);
    }
  }

  // 2. Add npm scripts to host package.json if not present
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

      if (updated) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
        console.log(`  ✅ Added 'commit' and 'clean:recordings' scripts to package.json`);
      }
    } catch {}
  }

  // 3. Enable Git performance features locally
  run("git config core.fsmonitor true", root);
  run("git config core.untrackedCache true", root);
  run("git config core.preloadindex true", root);
  console.log("  ✅ Enabled Git native fsmonitor & untrackedCache");

  console.log("🎉 [Git Guard] Project ready! Run 'npm run commit' for safe, descriptive commits.\n");
}

main();
