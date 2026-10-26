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
      profile: { birthDate: '1990-02-03', biologicalSex: 'male', heightCm: 180, weightKg: 81 },
      parq: parqNo,
      experience: {
        months: 18,
        trainingDaysPerWeek: 2,
        benchPressBestSet: { weightKg: 52.5, reps: 6 },
        progressionMode: 'tracks_loads',
      },
      objective: 'hypertrophy',
      availability: { daysPerWeek: 3, days: [1, 3, 5], startTime: '18:00', minutes: 60, sleepHours: 7, equipment: ['dumbbell'] },
      criteria: { experience: 2, frequency: 2, relativeStrength: 2, progression: 2 },
    })
  });
  assert.equal(response.status, 200);
  const saved = (await response.json()).assessment;
  assert.equal(saved.profile.bmi, 25);
  assert.equal(saved.parqSummary.initialRecoveryStatus, 'green');
  assert.equal(saved.level, 'intermediate');
  assert.equal(saved.levelStatus, 'scored');
  assert.equal(saved.levelPoints, 2);
  assert.deepEqual(saved.criteria, { experience: 1, frequency: 0, relativeStrength: 0, progression: 1 });
  assert.deepEqual(saved.benchPressEstimate, { method: 'epley', estimated1RMKg: 63, bodyweightRatio: 0.778 });
  assert.deepEqual(saved.experience.benchPressBestSet, { weightKg: 52.5, reps: 6 });
  assert.equal(saved.experience.trainingDaysPerWeek, 2);
  assert.equal(saved.availability.daysPerWeek, 3);
  assert.deepEqual(saved.eligibility, { status: 'eligible', eligible: true, missing: [], reasons: [] });
  assert.deepEqual(saved.planEntryGate, {
    status: 'passed', passed: true, blockingReasons: [],
    requiresLimitedIntensity: false, consultationRecommended: false,
  });

  const partial = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT', headers, body: JSON.stringify({ experience: { progressionMode: 'plan_with_rpe' } })
  });
  assert.equal(partial.status, 200);
  const updated = (await partial.json()).assessment;
  assert.equal(updated.experience.progressionMode, 'plan_with_rpe');
  assert.equal(updated.experience.trainingDaysPerWeek, 2);
  assert.deepEqual(updated.experience.benchPressBestSet, { weightKg: 52.5, reps: 6 });
  assert.equal(updated.levelPoints, 3);
  assert.equal(updated.criteria.progression, 2);

  const after = await fetch(`${h.api}/api/gymtrack/assessment`, { headers });
  assert.deepEqual((await after.json()).assessment, updated);
});

test('un PAR-Q positivo completo pasa el gate con intensidad limitada y recomendación', async t => {
  const h = await startServer(t);
  const headers = { Cookie: h.cookie, 'Content-Type': 'application/json' };
  const response = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      parq: { ...parqNo, chest_pain_activity: true },
      experience: { months: 18, trainingDaysPerWeek: 3 },
    })
  });
  assert.equal(response.status, 200);
  const assessment = (await response.json()).assessment;
  assert.deepEqual(assessment.planEntryGate, {
    status: 'passed', passed: true, blockingReasons: [],
    requiresLimitedIntensity: true, consultationRecommended: true,
  });
});

test('una persona elegible sin serie de banca recibe nivel provisional sin total inventado', async t => {
  const h = await startServer(t);
  const headers = { Cookie: h.cookie, 'Content-Type': 'application/json' };
  const response = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      profile: { birthDate: '1990-02-03', biologicalSex: 'female', heightCm: 165, weightKg: 60 },
      experience: { months: 18, trainingDaysPerWeek: 3, progressionMode: 'tracks_loads' },
    }),
  });
  assert.equal(response.status, 200);
  const assessment = (await response.json()).assessment;
  assert.equal(assessment.levelStatus, 'provisional');
  assert.equal(assessment.level, 'intermediate');
  assert.equal(assessment.levelPoints, null);
  assert.equal(assessment.levelMaxPoints, 8);
  assert.equal(assessment.criteria.experience, 1);
  assert.equal(assessment.criteria.relativeStrength, null);
  assert.equal(assessment.benchPressEstimate.estimated1RMKg, null);
});

test('la elegibilidad usa los días entrenados en P7 y no los días disponibles de P9', async t => {
  const h = await startServer(t);
  const headers = { Cookie: h.cookie, 'Content-Type': 'application/json' };
  const response = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      experience: { months: 4, trainingDaysPerWeek: 1 },
      availability: { daysPerWeek: 4, days: [1, 2, 3, 4] },
    })
  });
  assert.equal(response.status, 200);
  const assessment = (await response.json()).assessment;
  assert.deepEqual(assessment.eligibility, {
    status: 'ineligible',
    eligible: false,
    missing: [],
    reasons: ['training-duration-under-6-months', 'training-frequency-under-2-days'],
  });
  assert.deepEqual(assessment.planEntryGate, {
    status: 'blocked',
    passed: false,
    blockingReasons: ['training-duration-under-6-months', 'training-frequency-under-2-days', 'parq-incomplete'],
    requiresLimitedIntensity: false,
    consultationRecommended: false,
  });
  assert.equal(assessment.availability.daysPerWeek, 4);
  assert.equal(assessment.experience.trainingDaysPerWeek, 1);
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

test('el PAR-Q puede guardarse parcialmente sin borrar el perfil', async t => {
  const h = await startServer(t);
  const headers = { Cookie: h.cookie, 'Content-Type': 'application/json' };
  const profile = { birthDate: '1990-02-03', biologicalSex: 'female', heightCm: 165, weightKg: 62 };
  const first = await fetch(`${h.api}/api/gymtrack/assessment`, { method: 'PUT', headers, body: JSON.stringify({ profile }) });
  assert.equal(first.status, 200);
  const second = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT', headers, body: JSON.stringify({ parq: { heart_condition: false } })
  });
  assert.equal(second.status, 200);
  const saved = (await second.json()).assessment;
  assert.deepEqual(saved.profile, { ...profile, bmi: 22.8, bmiCategory: 'normal' });
  assert.equal(saved.parq.heart_condition, false);
  assert.equal(saved.parqSummary.complete, false);
});
