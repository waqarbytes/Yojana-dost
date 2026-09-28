import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, "dist");

fs.mkdirSync(distDir, { recursive: true });

// Copy all root HTML files to dist
const htmlFiles = fs.readdirSync(rootDir).filter((f) => f.endsWith(".html"));
for (const file of htmlFiles) {
  fs.copyFileSync(path.resolve(rootDir, file), path.resolve(distDir, file));
}

// Copy static directories (css, js, data, assets)
const staticDirs = ["css", "js", "data", "assets"];
for (const dir of staticDirs) {
  const srcPath = path.resolve(rootDir, dir);
  const destPath = path.resolve(distDir, dir);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
}

// Ensure schemes.json is guaranteed in dist/data
fs.mkdirSync(path.resolve(distDir, "data"), { recursive: true });
if (fs.existsSync(path.resolve(rootDir, "src/data/schemes.json"))) {
  fs.copyFileSync(
    path.resolve(rootDir, "src/data/schemes.json"),
    path.resolve(distDir, "data/schemes.json")
  );
}

console.log("✅ dist/ fully packaged with all HTML, CSS, JS, and data assets.");
