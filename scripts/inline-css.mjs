/* global console, URL */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const distDir = join(root, 'dist');
const indexPath = join(distDir, 'index.html');

let html = readFileSync(indexPath, 'utf8');

html = html.replace(
  /<link rel="stylesheet"[^>]*href="([^"]*\.css)"[^>]*>/g,
  (_match, href) => {
    const cssPath = join(distDir, href.replace(/^\/+/, ''));
    const css = readFileSync(cssPath, 'utf8');
    return `<style>\n${css}\n</style>`;
  },
);

writeFileSync(indexPath, html);
console.log('Inlined stylesheets into dist/index.html');