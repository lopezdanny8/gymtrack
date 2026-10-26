import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, Segmented } from '../components/ui.jsx'

const OBJECTIVES = [
  ['hypertrophy', 'Ganar músculo', 'Aumentar masa muscular y volumen.'],
  ['strength', 'Ganar fuerza', 'Mejorar tu rendimiento en los levantamientos.'],
  ['fat_loss', 'Perder grasa', 'Reducir grasa manteniendo el rendimiento.'],
  ['conditioning', 'Mejorar condición', 'Trabajar resistencia y capacidad física.'],
]

const MODES = [
  { value: 'tracks_loads', label: 'Registro cargas' },
  { value: 'follows_plan', label: 'Sigo un plan' },
  { value: 'new_to_training', label: 'Estoy empezando' },
]

export default function GymTrackExperience() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const [months, setMonths] = useState('')
  const [progressionMode, setProgressionMode] = useState('tracks_loads')
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
        setMonths(assessment.experience?.months ?? '')
        setProgressionMode(assessment.experience?.progressionMode || 'tracks_loads')
        setObjective(assessment.objective || '')
      })
      .catch(e => { if (active) setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos cargar tu evaluación.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const save = async () => {
    if (!(Number(months) >= 0) || !objective) {
      setError('Indica tus meses de experiencia y selecciona un objetivo.')
      return
    }
    setSaving(true); setError(''); setSaved(false)
    try {
      await api('/api/gymtrack/assessment', {
        method: 'PUT',
        body: JSON.stringify({
          experience: { months: Number(months), progressionMode },
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
          <div className="sub">Esto nos ayuda a proponer un punto de partida razonable.</div>
        </div>
        <button className="iconbtn" onClick={() => navigate('/onboarding/parq')} aria-label="Volver"><Icon name="chevronLeft" /></button>
      </div>

      <div className="card">
        <div className="field-label">¿Cuántos meses llevas entrenando?</div>
        <div className="input-with-unit">
          <NumberField decimal={false} nullable value={months} onChange={value => { setMonths(value ?? ''); setError(''); setSaved(false) }} aria-label="Meses de experiencia" />
          <span>meses</span>
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>¿Cómo entrenas actualmente?</div>
        <Segmented options={MODES} value={progressionMode} onChange={value => { setProgressionMode(value); setSaved(false) }} />
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
