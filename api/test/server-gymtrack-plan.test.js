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
const UID = 'gymtrack_plan_1';
const SECRET = crypto.randomBytes(32).toString('hex');
const token = () => {
  const payload = `${UID}:${Date.now() + 86400000}:0:c`;
  return payload + '.' + crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
};

async function startServer(t) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymtrack-plan-'));
  fs.writeFileSync(path.join(dataDir, 'secret'), SECRET, { mode: 0o600 });
  fs.writeFileSync(path.join(dataDir, 'db.json'), JSON.stringify({
    users: [{ id: UID, name: 'GymTrack Plan', created: new Date().toISOString() }],
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
  return { api: `http://127.0.0.1:${port}`, cookie: `gymsid=${token()}`, dataDir };
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

const completeAssessment = {
  profile: { birthDate: '1990-02-03', biologicalSex: 'male', heightCm: 180, weightKg: 81 },
  parq: parqNo,
  experience: { months: 18, trainingDaysPerWeek: 3, benchPressBestSet: { weightKg: 52.5, reps: 6 }, progressionMode: 'tracks_loads' },
  objective: 'hypertrophy',
  availability: { daysPerWeek: 3, days: [1, 3, 5], startTime: '18:00', minutes: 60, sleepHours: 7, equipment: ['dumbbell'] },
};

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('GymTrack plan API valida, genera idempotentemente, requiere regenerar assessment obsoleto y conserva los borradores PAR-Q positivos', async t => {
  const h = await startServer(t);
  const headers = { Cookie: h.cookie, 'Content-Type': 'application/json' };

  const anonymous = await fetch(`${h.api}/api/gymtrack/plan`);
  assert.equal(anonymous.status, 401);
  const absent = await fetch(`${h.api}/api/gymtrack/plan`, { method: 'POST', headers });
  assert.equal(absent.status, 409);
  assert.equal((await absent.json()).code, 'assessment-missing');

  const savedAssessment = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT', headers, body: JSON.stringify(completeAssessment)
  });
  assert.equal(savedAssessment.status, 200);
  const assessment = (await savedAssessment.json()).assessment;
  assert.equal(assessment.planEntryGate.status, 'passed');

  const generatedResponse = await fetch(`${h.api}/api/gymtrack/plan`, { method: 'POST', headers });
  assert.equal(generatedResponse.status, 201);
  const generated = await generatedResponse.json();
  assert.equal(generated.created, true);
  assert.equal(generated.stale, false);
  const plan = generated.plan;
  assert.equal(plan.status, 'ready');
  assert.equal(plan.activationAllowed, true);
  assert.equal(plan.sourceAssessmentUpdatedAt, assessment.updatedAt);
  assert.equal(plan.level, 'intermediate');
  assert.equal(plan.daysPerWeek, 3);
  assert.deepEqual(plan.days, [1, 3, 5]);
  assert.deepEqual(plan.duration.targetMinutes, 60);
  assert.ok(plan.duration.estimatedMinutes <= 60);
  assert.equal(plan.duration.adjusted, false);
  assert.equal(plan.routines.length, 3);
  assert.deepEqual(plan.schedule.map(slot => slot.day), [1, 3, 5]);
  assert.deepEqual(plan.cycle.weeks.map(week => week.phase), ['base', 'progression', 'intensification', 'deload']);
  assert.equal(plan.cycle.weeks[3].volumePercent, 60);
  assert.equal(plan.cycle.progressionRule.maxRpe, 8);
  assert.equal(plan.cycle.progressionRule.loadIncrementKg, 2.5);
  assert.equal(plan.adaptations.swapped, plan.adaptations.details.filter(item => item.type === 'substituted').length);
  assert.ok(plan.adaptations.details.every(item => item.exerciseId && item.routineName));

  const clientLevel = await fetch(`${h.api}/api/gymtrack/plan`, {
    method: 'POST', headers, body: JSON.stringify({ level: 'advanced' })
  });
  assert.equal(clientLevel.status, 400);
  assert.equal((await clientLevel.json()).code, 'request-invalid');

  const planFile = path.join(h.dataDir, `gymtrack-plan-${UID}.json`);
  assert.equal(fs.existsSync(planFile), true);
  assert.equal(fs.statSync(planFile).mode & 0o777, 0o600);
  assert.equal(fs.existsSync(path.join(h.dataDir, `gymtrack-assessment-${UID}.json`)), true);
  assert.equal(fs.existsSync(path.join(h.dataDir, `state-${UID}.json`)), false);

  const fetched = await fetch(`${h.api}/api/gymtrack/plan`, { headers });
  assert.equal(fetched.status, 200);
  const fetchedBody = await fetched.json();
  assert.deepEqual(fetchedBody.plan, plan);
  assert.equal(fetchedBody.stale, false);
  assert.equal(fetchedBody.reevaluation.status, 'current');
  assert.equal(fetchedBody.reevaluation.due, false);
  const confirmed = await fetch(`${h.api}/api/gymtrack/reassessment`, { method: 'POST', headers, body: '{}' });
  assert.equal(confirmed.status, 200);
  const confirmedBody = await confirmed.json();
  assert.equal(confirmedBody.reevaluation.status, 'current');
  assert.equal(confirmedBody.assessment.reevaluation.lastAt, confirmedBody.reevaluation.lastAt);
  const idempotent = await fetch(`${h.api}/api/gymtrack/plan`, { method: 'POST', headers });
  assert.equal(idempotent.status, 200);
  const idempotentBody = await idempotent.json();
  assert.equal(idempotentBody.created, false);
  assert.equal(idempotentBody.plan.id, plan.id);

  await pause(10);
  const changed = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT', headers, body: JSON.stringify({ objective: 'strength' })
  });
  assert.equal(changed.status, 200);
  const stale = await fetch(`${h.api}/api/gymtrack/plan`, { method: 'POST', headers });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).code, 'plan-stale');
  const regenerated = await fetch(`${h.api}/api/gymtrack/plan`, {
    method: 'POST', headers, body: JSON.stringify({ regenerate: true })
  });
  assert.equal(regenerated.status, 201);
  const refreshed = (await regenerated.json()).plan;
  assert.notEqual(refreshed.id, plan.id);
  assert.equal(refreshed.objective, 'strength');

  await pause(10);
  const positiveParq = await fetch(`${h.api}/api/gymtrack/assessment`, {
    method: 'PUT', headers, body: JSON.stringify({ parq: { chest_pain_activity: true } })
  });
  assert.equal(positiveParq.status, 200);
  const draft = await fetch(`${h.api}/api/gymtrack/plan`, {
    method: 'POST', headers, body: JSON.stringify({ regenerate: true })
  });
  assert.equal(draft.status, 201);
  const reviewPlan = (await draft.json()).plan;
  assert.equal(reviewPlan.status, 'review_required');
  assert.equal(reviewPlan.reviewRequired, true);
  assert.equal(reviewPlan.activationAllowed, false);
  assert.equal(reviewPlan.prescription.targetRpeMax, 5);
  assert.equal(reviewPlan.prescription.progressionEnabled, false);
  assert.equal(reviewPlan.cycle.progressionRule, null);
  assert.ok(reviewPlan.routines.every(routine => routine.ex.every(exercise => exercise.sets <= 2 && exercise.reps === 15 && exercise.weight === 0)));
});
