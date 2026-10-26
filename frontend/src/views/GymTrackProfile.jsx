import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, Segmented, TextField } from '../components/ui.jsx'

const emptyProfile = { birthDate: '', biologicalSex: 'male', heightCm: '', weightKg: '' }

function bmiOf(heightCm, weightKg) {
  const height = Number(heightCm)
  const weight = Number(weightKg)
  if (!(height > 0) || !(weight > 0)) return null
  return Number((weight / ((height / 100) ** 2)).toFixed(1))
}

function errorFor(profile) {
  if (!profile.birthDate) return 'Selecciona tu fecha de nacimiento.'
  if (!(Number(profile.heightCm) > 0)) return 'Escribe tu talla en centímetros.'
  if (!(Number(profile.weightKg) > 0)) return 'Escribe tu peso en kilogramos.'
  if (!['male', 'female'].includes(profile.biologicalSex)) return 'Selecciona una opción de sexo.'
  return ''
}

export default function GymTrackProfile() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/api/gymtrack/assessment')
      .then(body => {
        if (!active) return
        const saved = body?.assessment?.profile || {}
        setProfile({ ...emptyProfile, ...saved })
      })
      .catch(e => {
        if (active) setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos cargar tu evaluación.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const bmi = useMemo(() => bmiOf(profile.heightCm, profile.weightKg), [profile.heightCm, profile.weightKg])
  const set = (key, value) => { setProfile(current => ({ ...current, [key]: value })); setError(''); setMessage('') }

  const save = async () => {
    const validation = errorFor(profile)
    if (validation) { setError(validation); return }
    setSaving(true); setError(''); setMessage('')
    try {
      await api('/api/gymtrack/assessment', {
        method: 'PUT',
        body: JSON.stringify({ profile: {
          birthDate: profile.birthDate,
          biologicalSex: profile.biologicalSex,
          heightCm: Number(profile.heightCm),
          weightKg: Number(profile.weightKg),
        } })
      })
      setMessage('Datos guardados.')
      window.setTimeout(() => navigate('/home'), 250)
    } catch (e) {
      setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos guardar los datos. Inténtalo de nuevo.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="narrow"><div className="empty">Cargando tu evaluación…</div></div>

  return (
    <div className="narrow">
      <div className="hdr">
        <div>
          <div className="eyebrow">GYMTRACK</div>
          <h1>Tu perfil físico</h1>
          <div className="sub">Empecemos con algunos datos básicos para adaptar tu entrenamiento.</div>
        </div>
        <button className="iconbtn" onClick={() => navigate('/home')} aria-label="Cerrar"><Icon name="xmark" /></button>
      </div>

      {!user && <div className="card small" style={{ color: 'var(--orange)', marginBottom: 12 }}>Inicia sesión para guardar tu evaluación en tu perfil.</div>}

      <div className="card">
        <div className="field-label">Fecha de nacimiento</div>
        <TextField type="date" value={profile.birthDate} onChange={e => set('birthDate', e.target.value)} aria-label="Fecha de nacimiento" />

        <div className="field-label" style={{ marginTop: 18 }}>Sexo</div>
        <Segmented
          options={[{ value: 'male', label: 'Masculino' }, { value: 'female', label: 'Femenino' }]}
          value={profile.biologicalSex}
          onChange={value => set('biologicalSex', value)}
        />

        <div className="field-label" style={{ marginTop: 18 }}>Talla</div>
        <div className="input-with-unit">
          <NumberField decimal={false} nullable value={profile.heightCm} onChange={value => set('heightCm', value ?? '')} aria-label="Talla en centímetros" />
          <span>cm</span>
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>Peso</div>
        <div className="input-with-unit">
          <NumberField decimal value={profile.weightKg} onChange={value => set('weightKg', value ?? '')} aria-label="Peso en kilogramos" />
          <span>kg</span>
        </div>

        {bmi !== null && <div className="card small" style={{ marginTop: 18, background: 'var(--surface-2)' }}>
          <strong>IMC estimado: {bmi}</strong>
          <div className="muted" style={{ marginTop: 4 }}>Es una referencia informativa, no un diagnóstico médico.</div>
        </div>}
      </div>

      {error && <div className="card small" role="alert" style={{ color: 'var(--red)', marginTop: 12 }}>{error}</div>}
      {message && <div className="small" role="status" style={{ color: 'var(--green)', margin: '12px 4px' }}>{message}</div>}

      <Button variant="primary" onClick={save} disabled={saving || !user} style={{ width: '100%', marginTop: 14 }}>
        {saving ? 'Guardando…' : 'Guardar y continuar'}
      </Button>
      <button className="textbtn" onClick={() => navigate('/home')} style={{ display: 'block', margin: '16px auto' }}>Ahora no</button>
    </div>
  )
}
