import { globSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const targets = globSync(['src/**/*.js', 'scripts/**/*.js']);
for (const file of targets) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
console.log(`Checked ${targets.length} JavaScript files.`);
