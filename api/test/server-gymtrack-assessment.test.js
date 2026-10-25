import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { boundPort } from './helpers.mjs';

const API = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UID = 'gymtrack_web_1';
const SECRET = crypto.randomBytes(32).toString('hex');
const token = () => {
  const payload = `${UID}:${Date.now() + 86400000}:0:c`;
  return payload + '.' + crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
};

async function startServer(t) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymtrack-assessment-'));
  fs.writeFileSync(path.join(dataDir, 'secret'), SECRET, { mode: 0o600 });
  fs.writeFileSync(path.join(dataDir, 'db.json'), JSON.stringify({
    users: [{ id: UID, name: 'GymTrack Web', created: new Date().toISOString() }],
    creds: [], subs: [], invites: []
  }));
  const child = spawn(process.execPath, ['server.js'], {
    cwd: API,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '0', DATA_DIR: dataDir, ORIGIN: 'http://localhost:8080', RP_ID: 'localhost', MEDIA_UPLOADS: '0' }
  });
  t.after(() => { child.kill('SIGKILL'); fs.rmSync(dataDir, { recursive: true, force: true }); });
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
  const port = await boundPort(child, () => log);
  return { api: `http://127.0.0.1:${port}`, cookie: `gymsid=${token()}` };
}

const parqNo = {
  heart_condition: false,
  chest_pain_activity: false,
  chest_pain_rest: false,
  dizziness: false,
  bone_joint: false,
  medication: false,
  other_reason: false,
};

test('la evaluación web se guarda separada y se recupera autenticada', async t => {
  const h = await startServer(t);
  const headers = { Cookie: h.cookie, 'Content-Type': 'application/json' };
  const before = await fetch(`${h.api}/api/gymtrack/assessment`, { headers });
  assert.equal(before.status, 200);
  assert.deepEqual(await before.json(), { assessment: null });

  const response = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      profile: { birthDate: '1990-02-03', biologicalSex: 'prefer_not_to_say', heightCm: 180, weightKg: 81 },
      parq: parqNo,
      experience: { months: 18, progressionMode: 'tracks_loads' },
      objective: 'hypertrophy',
      availability: { daysPerWeek: 3, days: [1, 3, 5], startTime: '18:00', minutes: 60, sleepHours: 7, equipment: ['dumbbell'] },
    })
  });
  assert.equal(response.status, 200);
  const saved = (await response.json()).assessment;
  assert.equal(saved.profile.bmi, 25);
  assert.equal(saved.parqSummary.initialRecoveryStatus, 'green');
  assert.equal(saved.level, null);
  assert.equal(saved.levelStatus, 'pending-scoring-thresholds');

  const after = await fetch(`${h.api}/api/gymtrack/assessment`, { headers });
  assert.deepEqual((await after.json()).assessment, saved);
});

test('la evaluación exige sesión y rechaza un perfil físico imposible', async t => {
  const h = await startServer(t);
  const anonymous = await fetch(`${h.api}/api/gymtrack/assessment`);
  assert.equal(anonymous.status, 401);
  const response = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT',
    headers: { Cookie: h.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: { birthDate: '1990-02-03', heightCm: 0, weightKg: 81, biologicalSex: 'male' } })
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'assessment-invalid');
  assert.equal(body.fields.profile.heightCm, 'height-invalid');
});
