import fs from 'node:fs';
import path from 'node:path';

const DATA = process.env.DATA_DIR || '/data';

const fileFor = uid => path.join(DATA, `gymtrack-assessment-${String(uid).replace(/[^a-zA-Z0-9_-]/g, '')}.json`);

export function readAssessment(uid) {
  try {
    const value = JSON.parse(fs.readFileSync(fileFor(uid), 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch (error) {
    if (error?.code !== 'ENOENT') console.error('gymtrack assessment unreadable:', error.message);
    return null;
  }
}

export function saveAssessment(uid, assessment) {
  fs.mkdirSync(DATA, { recursive: true });
  const file = fileFor(uid);
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(assessment, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
  try { fs.chmodSync(file, 0o600); } catch { /* best effort on bind mounts */ }
}
