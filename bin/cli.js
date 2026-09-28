#!/usr/bin/env node
/**
 * @thashiznitt/git-guard CLI
 *
 * Universal Git Safety, Build Cache Cleaner & Descriptive Commit Tooling
 * Supports all web, mobile, compiled and backend frameworks.
 */

const { executeCommit } = require("../lib/commit");
const { cleanRecordings, cleanDuplicateNodeModules, cleanBuildCaches, formatBytes } = require("../lib/cleaner");
const { checkFileSizeGuard } = require("../lib/guard");

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
🛡️  Git Guard — Universal Git Safety, Cache Cleaner & Monorepo Tooling

Commands:
  git-guard commit [-m "subject"] [-d "description"]
      Checks 10MB size guard, purges ephemeral AI recordings, removes duplicate
      nested node_modules, groups files by framework/domain, and generates a
      detailed conventional commit.

  git-guard dedupe
      Recursively scans and removes all duplicate nested node_modules in
      monorepos (e.g. apps/*/node_modules, packages/*/node_modules) while
      preserving the root node_modules.

  git-guard clean [--builds] [--all]
      Cleans browser recordings, AI inspection media, logs, and duplicate
      node_modules. With --builds or --all, also removes heavy build caches
      (Next.js, Vite, Turbo, Swift SPM, Android, Python, etc.)

  git-guard check [--max-size <mb>]
      Checks staged files against size limit (default: 10MB). Used in pre-commit hooks.

  git-guard init
      Installs size guard & dedupe hook into .husky or .git/hooks, enables Git fsmonitor,
      and adds 'commit', 'dedupe:modules', and 'clean:recordings' scripts to package.json.

Examples:
  npx git-guard commit
  npx git-guard dedupe
  npx git-guard clean --builds
  npx git-guard init
`);
}

switch (command) {
  case "dedupe":
  case "dedupe:modules": {
    console.log("🧹 [Git Guard] Scanning for duplicate nested node_modules...\n");
    const result = cleanDuplicateNodeModules(process.cwd(), true);
    if (result.cleanedPaths.length > 0) {
      console.log(`\n✅ Removed ${result.cleanedPaths.length} duplicate node_modules folder(s) (freed ${formatBytes(result.clearedBytes)}).`);
    } else {
      console.log("\n✅ Perfect! No duplicate node_modules exist.");
    }
    break;
  }

  case "clean":
  case "clean:recordings": {
    console.log("🧹 Running Git Guard Cleaner...\n");
    cleanRecordings(true);

    console.log("\n🔍 Checking for duplicate nested node_modules...");
    cleanDuplicateNodeModules(process.cwd(), true);

    if (args.includes("--builds") || args.includes("--all") || args.includes("-b")) {
      console.log("\n📦 Cleaning universal build caches (Next, Vite, Swift, Android, Python, etc.)...");
      const buildResult = cleanBuildCaches();
      console.log(`  ✓ Cleared ${buildResult.cleanedPaths.length} build artifact directories (freed ${formatBytes(buildResult.totalBytes)})`);
    }

    console.log(`\n✅ Cleaner finished successfully!`);
    break;
  }

  case "check": {
    let maxKb = 10240;
    const sizeIdx = args.indexOf("--max-size");
    if (sizeIdx !== -1 && args[sizeIdx + 1]) {
      maxKb = parseInt(args[sizeIdx + 1], 10) * 1024;
    }
    checkFileSizeGuard({ maxKb });
    console.log("✅ [Git Guard] Size check passed: All staged files are within safe limits.");
    break;
  }

  case "init":
  case "install": {
    require("./install");
    break;
  }

  case "commit": {
    executeCommit(args.slice(1));
    break;
  }

  case "--help":
  case "-h":
  case "help": {
    printHelp();
    break;
  }

  default: {
    if (!command || command.startsWith("-")) {
      executeCommit(args);
    } else {
      printHelp();
    }
    break;
  }
}
