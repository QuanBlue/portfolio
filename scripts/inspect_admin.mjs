import fs from 'fs';

const c = fs.readFileSync('src/pages/admin.astro', 'utf8');
const lines = c.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('admin-tabs') || line.includes('renderTab') || line.includes('experience') || line.includes('education')) {
    if (line.includes('function') || line.includes('const') || line.includes('let') || line.includes('case')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
}
