const PREFIX = 'gymtrack_onboarding_draft_v1:';

const storage = () => {
  try { return globalThis.localStorage; } catch { return null; }
};

export function readGymTrackDraft(step, fallback = {}) {
  try {
    const raw = storage()?.getItem(`${PREFIX}${step}`);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? { ...fallback, ...value } : fallback;
  } catch {
    return fallback;
  }
}

export function writeGymTrackDraft(step, value) {
  try { storage()?.setItem(`${PREFIX}${step}`, JSON.stringify(value)); } catch { /* best effort; form state remains live */ }
}

export function clearGymTrackDraft(step) {
  try { storage()?.removeItem(`${PREFIX}${step}`); } catch { /* best effort */ }
}
