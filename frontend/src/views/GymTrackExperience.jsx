import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, Segmented } from '../components/ui.jsx'

const OBJECTIVES = [
  ['hypertrophy', 'Ganar músculo', 'Aumentar masa muscular y volumen.'],
  ['strength', 'Ganar fuerza', 'Mejorar tu rendimiento en los levantamientos.'],
  ['recomposition', 'Recomposición', 'Mejorar la relación entre masa muscular y grasa corporal.'],
  ['performance', 'Rendimiento', 'Mejorar tu desempeño físico.'],
]

const MODES = [
  { value: 'no_log', label: 'Sin registro' },
  { value: 'tracks_loads', label: 'Registro mis cargas' },
  { value: 'plan_with_rpe', label: 'Plan con RPE' },
]

const hasValue = value => value !== '' && value !== null && value !== undefined

export default function GymTrackExperience() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const [months, setMonths] = useState('')
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState('')
  const [benchWeightKg, setBenchWeightKg] = useState('')
  const [benchReps, setBenchReps] = useState('')
  const [progressionMode, setProgressionMode] = useState('')
  const [objective, setObjective] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    api('/api/gymtrack/assessment')
      .then(body => {
        if (!active) return
        const assessment = body?.assessment || {}
        const experience = assessment.experience || {}
        setMonths(experience.months ?? '')
        setTrainingDaysPerWeek(experience.trainingDaysPerWeek ?? '')
        setBenchWeightKg(experience.benchPressBestSet?.weightKg ?? '')
        setBenchReps(experience.benchPressBestSet?.reps ?? '')
        setProgressionMode(MODES.some(mode => mode.value === experience.progressionMode) ? experience.progressionMode : '')
        setObjective(OBJECTIVES.some(([value]) => value === assessment.objective) ? assessment.objective : '')
      })
      .catch(e => { if (active) setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos cargar tu evaluación.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const save = async () => {
    const monthCount = hasValue(months) ? Number(months) : NaN
    const currentTrainingDays = hasValue(trainingDaysPerWeek) ? Number(trainingDaysPerWeek) : NaN
    const hasWeight = hasValue(benchWeightKg)
    const hasReps = hasValue(benchReps)

    if (!Number.isFinite(monthCount) || monthCount < 0) {
      setError('Indica cuántos meses llevas entrenando.')
      return
    }
    if (!Number.isInteger(currentTrainingDays) || currentTrainingDays < 0 || currentTrainingDays > 7) {
      setError('Indica cuántos días entrenas actualmente por semana (de 0 a 7).')
      return
    }
    if (!MODES.some(mode => mode.value === progressionMode)) {
      setError('Selecciona cómo progresas las cargas actualmente.')
      return
    }
    if (!OBJECTIVES.some(([value]) => value === objective)) {
      setError('Selecciona tu objetivo principal.')
      return
    }
    if (hasWeight !== hasReps) {
      setError('Para registrar la serie de press, completa tanto la carga como las repeticiones.')
      return
    }
    if (hasWeight && (!(Number(benchWeightKg) > 0) || !Number.isInteger(Number(benchReps)) || Number(benchReps) < 2 || Number(benchReps) > 10)) {
      setError('Usa una carga válida y de 2 a 10 repeticiones para estimar tu fuerza.')
      return
    }

    setSaving(true); setError(''); setSaved(false)
    try {
      await api('/api/gymtrack/assessment', {
        method: 'PUT',
        body: JSON.stringify({
          experience: {
            months: monthCount,
            trainingDaysPerWeek: currentTrainingDays,
            benchPressBestSet: hasWeight ? { weightKg: Number(benchWeightKg), reps: Number(benchReps) } : null,
            progressionMode,
          },
          objective,
        })
      })
      setSaved(true)
      window.setTimeout(() => navigate('/onboarding/availability'), 250)
    } catch (e) {
      setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos guardar tus datos. Inténtalo de nuevo.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="narrow"><div className="empty">Cargando tu evaluación…</div></div>

  return (
    <div className="narrow">
      <div className="hdr">
        <div>
          <div className="eyebrow">PASO 3 DE 5</div>
          <h1>Experiencia y objetivo</h1>
          <div className="sub">Distingue tu entrenamiento actual de los días que tendrás disponibles para el plan.</div>
        </div>
        <button className="iconbtn" onClick={() => navigate('/onboarding/parq')} aria-label="Volver"><Icon name="chevronLeft" /></button>
      </div>

      <div className="card">
        <div className="field-label">¿Cuántos meses llevas entrenando?</div>
        <div className="input-with-unit">
          <NumberField decimal={false} nullable value={months} onChange={value => { setMonths(value ?? ''); setError(''); setSaved(false) }} aria-label="Meses de experiencia" />
          <span>meses</span>
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>¿Cuántos días por semana entrenas actualmente?</div>
        <div className="input-with-unit">
          <NumberField decimal={false} nullable value={trainingDaysPerWeek} onChange={value => { setTrainingDaysPerWeek(value ?? ''); setError(''); setSaved(false) }} aria-label="Días de entrenamiento actual por semana" />
          <span>días (0–7)</span>
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>Mejor serie reciente de press de banca</div>
        <div className="row" style={{ gap: 10 }}>
          <div className="input-with-unit" style={{ flex: 1 }}>
            <NumberField nullable value={benchWeightKg} onChange={value => { setBenchWeightKg(value ?? ''); setError(''); setSaved(false) }} aria-label="Carga de press de banca en kilogramos" />
            <span>kg</span>
          </div>
          <div className="input-with-unit" style={{ flex: 1 }}>
            <NumberField decimal={false} nullable value={benchReps} onChange={value => { setBenchReps(value ?? ''); setError(''); setSaved(false) }} aria-label="Repeticiones de press de banca" />
            <span>repeticiones</span>
          </div>
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>Usaremos Epley solo con una serie reciente de 2–10 repeticiones; no hagas un intento máximo. Si no tienes una, deja ambos campos vacíos y tu nivel será intermedio provisional.</div>

        <div className="field-label" style={{ marginTop: 18 }}>¿Cómo progresas las cargas?</div>
        <Segmented options={MODES} value={progressionMode} onChange={value => { setProgressionMode(value); setError(''); setSaved(false) }} />
      </div>

      <div className="field-label" style={{ margin: '2px 4px 8px' }}>¿Cuál es tu objetivo principal?</div>
      <div className="objective-list">
        {OBJECTIVES.map(([value, title, description]) => (
          <button key={value} className={'objective-card' + (objective === value ? ' selected' : '')} onClick={() => { setObjective(value); setError(''); setSaved(false) }} aria-pressed={objective === value}>
            <span><strong>{title}</strong><small>{description}</small></span>
            <Icon name={objective === value ? 'checkCircle' : 'chevronRight'} />
          </button>
        ))}
      </div>

      {error && <div className="card small" role="alert" style={{ color: 'var(--red)', marginTop: 12 }}>{error}</div>}
      {saved && <div className="small" role="status" style={{ color: 'var(--green)', margin: '12px 4px' }}>Avance guardado.</div>}

      <Button variant="primary" disabled={saving || !user} onClick={save} style={{ width: '100%', marginTop: 14 }}>
        {saving ? 'Guardando…' : 'Guardar y continuar'}
      </Button>
      <button className="textbtn" onClick={() => navigate('/home')} style={{ display: 'block', margin: '16px auto' }}>Ahora no</button>
    </div>
  )
}
