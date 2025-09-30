#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../src/components/icons');
const outputPath = path.join(__dirname, '../src/components/icon-paths.js');

const iconFiles = fs.readdirSync(iconsDir);

const iconPaths = {};

const pathRegex = /d="([^"]*)"/g;

for (const file of iconFiles) {
  if (file.endsWith('.tsx')) {
    const content = fs.readFileSync(path.join(iconsDir, file), 'utf-8');
    const matches = [...content.matchAll(pathRegex)];
    const paths = matches.map(match => match[1]);
    const iconName = file.replace('.tsx', '');
    iconPaths[iconName] = paths;
  }
}

const outputContent = `module.exports.iconPaths = ${JSON.stringify(iconPaths, null, 2)};`;

fs.writeFileSync(outputPath, outputContent);

console.log('Successfully generated icon-paths.js');