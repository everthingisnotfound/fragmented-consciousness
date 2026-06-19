import fs from 'fs';
import path from 'path';

const transcript = fs.readFileSync(
  'C:/Users/Arjun/.cursor/projects/d-coding-folders-fragmented-consciousness-complete-fragmented-consciousness/agent-transcripts/b71b103e-334c-41a3-ac6c-d9f1d9dbc9d6/b71b103e-334c-41a3-ac6c-d9f1d9dbc9d6.jsonl',
  'utf8',
);

const files = [
  'WindowBody.tsx',
  'WindowVision.tsx',
  'WindowMemory.tsx',
  'WindowTouch.tsx',
  'WindowHearing.tsx',
  'WindowEmotion.tsx',
];

const base = path.resolve('client/src/pages');

for (const file of files) {
  const escaped = file.replace('.', '\\.');
  const re = new RegExp(
    `"Write","input":\\{"contents":"([\\s\\S]*?)","path":"[^"]*${escaped}"`,
    'g',
  );
  let last = null;
  let m;
  while ((m = re.exec(transcript)) !== null) last = m;
  if (!last) {
    console.log('FAIL', file);
    continue;
  }
  let content = last[1];
  content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  fs.writeFileSync(path.join(base, file), content);
  console.log('OK', file, content.length);
}
