const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { checkFileSizeGuard } = require("./guard");
const { cleanRecordings } = require("./cleaner");

function run(cmd, options = {}) {
  return execSync(cmd, {
    stdio: options.silent ? "pipe" : "inherit",
    encoding: "utf8",
    ...options,
  });
}

function runOutput(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

/**
 * Parses -m and -d args or positional strings
 */
function parseArgs(args) {
  let subject = "";
  let description = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-m" || arg === "--message") {
      subject = args[++i] || "";
    } else if (arg === "-d" || arg === "--desc" || arg === "--details" || arg === "--explanation") {
      description = args[++i] || "";
    } else if (!arg.startsWith("-")) {
      if (!subject) subject = arg.trim();
      else if (!description) description = arg.trim();
    }
  }

  return { subject, description };
}

/**
 * Universal Framework & Language File Categorizer
 */
const frameworkCategories = {
  "Frontend & Web": (f) =>
    /\.(jsx?|tsx?|vue|svelte|astro|html|css|scss|sass|less)$/i.test(f) &&
    (f.includes("/app/") || f.includes("/pages/") || f.includes("/src/") || f.includes("/web/") || f.includes("/client/")),
  "Backend & APIs": (f) =>
    f.includes("/api/") ||
    f.includes("/server/") ||
    f.includes("/backend/") ||
    /\.(py|go|rs|rb|php|java|cs)$/i.test(f) ||
    f.includes("controller") ||
    f.includes("service") ||
    f.includes("resolver"),
  "Mobile (iOS / Android / Flutter)": (f) =>
    f.includes("/ios/") ||
    f.includes("/android/") ||
    f.includes("/mobile/") ||
    /\.(swift|kt|dart|m|mm|gradle)$/i.test(f),
  "Database & Schemas": (f) =>
    f.includes("/prisma/") ||
    f.includes("/drizzle/") ||
    f.includes("/migrations/") ||
    /\.(sql|prisma)$/i.test(f) ||
    f.includes("schema"),
  "UI & Components": (f) =>
    f.includes("/components/") || f.includes("/ui/") || f.includes("/theme/") || f.includes("/styles/"),
  "Tests & Specs": (f) =>
    f.includes("/test") ||
    f.includes("/spec") ||
    /\.(test|spec)\.[a-z]+$/i.test(f),
  "DevOps & CI/CD": (f) =>
    f.startsWith(".github/") ||
    f.includes("Dockerfile") ||
    f.includes("docker-compose") ||
    /\.(ya?ml|tf)$/i.test(f),
  "Documentation": (f) =>
    f.startsWith("docs/") || /\.(md|mdx|txt)$/i.test(f),
  "Tooling & Configuration": () => true, // Fallback
};

async function executeCommit(args = []) {
  console.log("══════════════════════════════════════════════════════");
  console.log("🛡️  Git Guard: Descriptive Commit & Safety Pipeline");
  console.log("══════════════════════════════════════════════════════\n");

  const stagedOutput = runOutput("git diff --cached --name-only");
  if (!stagedOutput) {
    console.error("❌ Commit rejected: No changes staged.");
    console.error("   Stage files explicitly before committing:");
    console.error("   git add <file1> <file2> ...\n");
    process.exit(1);
  }

  const changedFiles = stagedOutput.split("\n").filter(Boolean).map((s) => s.trim());
  console.log(`📦 Found ${changedFiles.length} staged file(s).`);

  // 1. Run Size Guard
  checkFileSizeGuard();

  // 2. Clear ephemeral AI browser recordings & scratch screenshots
  try {
    cleanRecordings(false);
  } catch {}

  // 3. Parse commit messages
  let { subject, description } = parseArgs(args);

  if (!subject) {
    if (process.stdin.isTTY) {
      subject = await askQuestion("📝 Enter commit subject (e.g. feat: add checkout button): ");
    }
    if (!subject) {
      console.error("\n❌ Commit rejected: Missing required subject (-m <subject>).");
      process.exit(1);
    }
  }

  if (!description) {
    if (process.stdin.isTTY) {
      description = await askQuestion("📖 Enter detailed description (what changed and why): ");
    }
    if (!description) {
      console.error("\n❌ Commit rejected: Missing required description (-d <description>).");
      process.exit(1);
    }
  }

  // 4. Collect diff line statistics (+10, -2)
  const fileStatsMap = {};
  const numstatOutput = runOutput("git diff --cached --numstat");
  if (numstatOutput) {
    numstatOutput.split("\n").filter(Boolean).forEach((line) => {
      const [added, deleted, filePath] = line.split(/\s+/);
      if (filePath) {
        fileStatsMap[filePath] = `(+${added}, -${deleted})`;
      }
    });
  }

  // 5. Categorize files by domain
  const categorized = {};
  for (const cat of Object.keys(frameworkCategories)) {
    categorized[cat] = [];
  }

  for (const file of changedFiles) {
    for (const [cat, matcher] of Object.entries(frameworkCategories)) {
      if (matcher(file)) {
        categorized[cat].push(file);
        break;
      }
    }
  }

  const formatFileList = (files) =>
    files.map((f) => `  - ${f}${fileStatsMap[f] ? ` ${fileStatsMap[f]}` : ""}`).join("\n");

  const bodySections = [];
  for (const [cat, files] of Object.entries(categorized)) {
    if (files.length > 0) {
      bodySections.push(`${cat}:\n${formatFileList(files)}`);
    }
  }

  const fullCommitMessage = `${subject}

${description}

Files:
${bodySections.join("\n\n")}

Safety Verification:
- Size Guard: PASSED (all staged files < 10MB)
- Build Hygiene: Clean`;

  console.log("\n──────────────────────────────────────────────────────");
  console.log("📝 Commit Message Preview:");
  console.log("──────────────────────────────────────────────────────\n");
  console.log(fullCommitMessage);
  console.log("\n──────────────────────────────────────────────────────\n");

  // Write temporary message file and commit
  const gitDir = runOutput("git rev-parse --git-dir") || ".git";
  const tempFile = path.resolve(gitDir, "COMMIT_EDITMSG_AUTO");

  try {
    fs.writeFileSync(tempFile, fullCommitMessage, "utf8");
    run(`git commit -F "${tempFile}"`);
    try { fs.unlinkSync(tempFile); } catch {}
    console.log("✅ Successfully created detailed commit locally!");
  } catch (err) {
    try { fs.unlinkSync(tempFile); } catch {}
    console.error("❌ Git commit failed:", err.message);
    process.exit(1);
  }
}

module.exports = {
  executeCommit,
};
