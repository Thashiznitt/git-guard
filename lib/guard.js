const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function runOutput(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

/**
 * Checks all staged files for size threshold (default: 10MB).
 * Returns true if passed, exits process if violations found.
 */
function checkFileSizeGuard(options = {}) {
  const maxKb = options.maxKb || (parseInt(process.env.GIT_GUARD_MAX_MB || "10", 10) * 1024);
  const staged = runOutput("git diff --cached --name-only");
  
  if (!staged) return true;

  const files = staged.split("\n").filter(Boolean).map((s) => s.trim());
  const violations = [];

  for (const file of files) {
    if (fs.existsSync(file)) {
      try {
        const stats = fs.statSync(file);
        const sizeKb = Math.round(stats.size / 1024);
        if (sizeKb > maxKb) {
          violations.push({ file, sizeKb });
        }
      } catch {}
    }
  }

  if (violations.length > 0) {
    console.error("\n❌ [Git Guard] Commit blocked: Staged files exceed size limit (" + Math.round(maxKb / 1024) + "MB):\n");
    for (const v of violations) {
      console.error(`   • ${v.file} (${(v.sizeKb / 1024).toFixed(1)} MB)`);
    }
    console.error("\n💡 Large binary or dump files should not be stored in Git history.");
    console.error("   To keep these files safely on disk without committing them:\n");
    for (const v of violations) {
      console.error(`     git reset HEAD "${v.file}"`);
      console.error(`     echo "${v.file}" >> .gitignore`);
    }
    console.error("");
    process.exit(1);
  }

  return true;
}

module.exports = {
  checkFileSizeGuard,
};
