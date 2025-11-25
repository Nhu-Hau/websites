#!/usr/bin/env node
/**
 * Scan src/ for useTranslations() usages and report keys missing in en/vi messages.
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const SRC_DIR = path.join(__dirname, "../src");
const EN_PATH = path.join(__dirname, "../src/messages/en.json");
const VI_PATH = path.join(__dirname, "../src/messages/vi.json");

const enMessages = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
const viMessages = JSON.parse(fs.readFileSync(VI_PATH, "utf8"));

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "dist", "build"].includes(entry)) continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function hasPath(root, keyPath) {
  const segments = keyPath.split(".");
  let current = root;
  for (const segment of segments) {
    if (current == null || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return false;
    }
    current = current[segment];
  }
  return true;
}

function recordMissingKey(store, key, file, position, locale) {
  if (!store[key]) {
    store[key] = { file, position, missingLocales: new Set() };
  }
  store[key].missingLocales.add(locale);
}

function analyzeFile(filePath, missingMap) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const translators = new Map();

  function registerTranslator(identifier, namespace) {
    translators.set(identifier, namespace || null);
  }

  function getTranslatorNamespace(name) {
    return translators.has(name) ? translators.get(name) : null;
  }

  function processCall(callExpression) {
    let calleeName = null;
    if (ts.isIdentifier(callExpression.expression)) {
      calleeName = callExpression.expression.text;
    } else if (
      ts.isPropertyAccessExpression(callExpression.expression) &&
      ts.isIdentifier(callExpression.expression.expression)
    ) {
      calleeName = callExpression.expression.expression.text;
    }

    if (!calleeName || !translators.has(calleeName)) return;
    const firstArg = callExpression.arguments[0];
    if (!firstArg) return;

    if (
      !ts.isStringLiteral(firstArg) &&
      !ts.isNoSubstitutionTemplateLiteral(firstArg)
    ) {
      return;
    }

    const namespace = getTranslatorNamespace(calleeName);
    const key = namespace
      ? `${namespace}.${firstArg.text}`
      : firstArg.text;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      firstArg.getStart()
    );
    if (!hasPath(enMessages, key)) {
      recordMissingKey(
        missingMap,
        key,
        filePath,
        { line: line + 1, column: character + 1 },
        "en"
      );
    }
    if (!hasPath(viMessages, key)) {
      recordMissingKey(
        missingMap,
        key,
        filePath,
        { line: line + 1, column: character + 1 },
        "vi"
      );
    }
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === "useTranslations"
    ) {
      const arg = node.initializer.arguments[0];
      if (
        arg &&
        (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))
      ) {
        registerTranslator(node.name.text, arg.text);
      } else {
        registerTranslator(node.name.text, null);
      }
    }

    if (ts.isCallExpression(node)) {
      processCall(node);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function main() {
  const files = walk(SRC_DIR);
  const missingMap = {};
  files.forEach((file) => analyzeFile(file, missingMap));

  const entries = Object.entries(missingMap);
  if (!entries.length) {
    console.log("✅ No missing translation keys detected!");
    return;
  }

  console.log(`❌ Found ${entries.length} missing translation keys:\n`);
  entries.forEach(([key, info]) => {
    const locales = Array.from(info.missingLocales).join(", ");
    console.log(
      `- ${key} (${locales}) — ${path.relative(
        process.cwd(),
        info.file
      )}:${info.position.line}:${info.position.column}`
    );
  });
}

main();

