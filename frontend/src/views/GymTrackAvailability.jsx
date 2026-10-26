import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import Icon from '../components/Icon.jsx'
import { Button, NumberField, Segmented, TextField } from '../components/ui.jsx'

const DAYS = [['lunes', 1], ['martes', 2], ['miércoles', 3], ['jueves', 4], ['viernes', 5], ['sábado', 6], ['domingo', 0]]
const EQUIPMENT = [
  ['bodyweight', 'Peso corporal'], ['dumbbell', 'Mancuernas'], ['barbell', 'Barra y discos'],
  ['machines', 'Máquinas'], ['cables', 'Poleas'], ['bands', 'Bandas'],
]
const FREQUENCIES = [2, 3, 4, 5, 6].map(value => ({ value, label: `${value} días` }))

export default function GymTrackAvailability() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [days, setDays] = useState([1, 3, 5])
  const [startTime, setStartTime] = useState('18:00')
  const [minutes, setMinutes] = useState(60)
  const [sleepHours, setSleepHours] = useState(7)
  const [equipment, setEquipment] = useState(['bodyweight', 'dumbbell'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/api/gymtrack/assessment')
      .then(body => {
        if (!active) return
        const saved = body?.assessment?.availability || {}
        if (Number.isInteger(saved.daysPerWeek)) setDaysPerWeek(saved.daysPerWeek)
        if (Array.isArray(saved.days) && saved.days.length) setDays(saved.days)
        if (saved.startTime) setStartTime(saved.startTime)
        if (Number.isInteger(saved.minutes)) setMinutes(saved.minutes)
        if (Number.isFinite(saved.sleepHours)) setSleepHours(saved.sleepHours)
        if (Array.isArray(saved.equipment)) setEquipment(saved.equipment)
      })
      .catch(e => { if (active) setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos cargar tu evaluación.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const toggleDay = day => {
    setDays(current => {
      const next = current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort((a, b) => a - b)
      return next
    })
    setError('')
  }
  const toggleEquipment = item => setEquipment(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])

  const save = async () => {
    if (days.length !== daysPerWeek) { setError(`Selecciona exactamente ${daysPerWeek} días de entrenamiento.`); return }
    if (!(Number(minutes) >= 30 && Number(minutes) <= 90)) { setError('La duración debe estar entre 30 y 90 minutos.'); return }
    if (!(Number(sleepHours) >= 0 && Number(sleepHours) <= 24)) { setError('Revisa las horas de sueño.'); return }
    setSaving(true); setError('')
    try {
      await api('/api/gymtrack/assessment', {
        method: 'PUT',
        body: JSON.stringify({ availability: { daysPerWeek, days, startTime, minutes: Number(minutes), sleepHours: Number(sleepHours), equipment } })
      })
      window.setTimeout(() => navigate('/home'), 250)
    } catch (e) {
      setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos guardar tus datos. Inténtalo de nuevo.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="narrow"><div className="empty">Cargando tu evaluación…</div></div>

  return (
    <div className="narrow">
      <div className="hdr">
        <div>
          <div className="eyebrow">PASO 4 DE 5</div>
          <h1>Tu disponibilidad</h1>
          <div className="sub">El plan debe adaptarse a tu semana real, no al revés.</div>
        </div>
        <button className="iconbtn" onClick={() => navigate('/onboarding/experience')} aria-label="Volver"><Icon name="chevronLeft" /></button>
      </div>

      <div className="card">
        <div className="field-label">¿Cuántos días puedes entrenar?</div>
        <Segmented options={FREQUENCIES} value={daysPerWeek} onChange={value => { setDaysPerWeek(value); setDays(current => current.slice(0, value)); setError('') }} />

        <div className="field-label" style={{ marginTop: 18 }}>¿Qué días prefieres?</div>
        <div className="day-choice-grid">
          {DAYS.map(([label, value]) => <button key={value} className={'choice-chip' + (days.includes(value) ? ' selected' : '')} onClick={() => toggleDay(value)} aria-pressed={days.includes(value)}>{label}</button>)}
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>Hora habitual de inicio</div>
        <TextField type="time" value={startTime} onChange={e => setStartTime(e.target.value)} aria-label="Hora habitual de inicio" />

        <div className="field-label" style={{ marginTop: 18 }}>Duración de la sesión</div>
        <div className="input-with-unit"><NumberField decimal={false} value={minutes} onChange={value => setMinutes(value ?? '')} aria-label="Duración en minutos" /><span>minutos</span></div>

        <div className="field-label" style={{ marginTop: 18 }}>Horas de sueño habituales</div>
        <div className="input-with-unit"><NumberField value={sleepHours} onChange={value => setSleepHours(value ?? '')} aria-label="Horas de sueño" /><span>horas</span></div>
      </div>

      <div className="field-label" style={{ margin: '2px 4px 8px' }}>¿Qué equipamiento tienes disponible?</div>
      <div className="choice-list">
        {EQUIPMENT.map(([value, label]) => <button key={value} className={'choice-row' + (equipment.includes(value) ? ' selected' : '')} onClick={() => toggleEquipment(value)} aria-pressed={equipment.includes(value)}><span>{label}</span><Icon name={equipment.includes(value) ? 'checkCircle' : 'circle'} /></button>)}
      </div>

      {error && <div className="card small" role="alert" style={{ color: 'var(--red)', marginTop: 12 }}>{error}</div>}
      <Button variant="primary" disabled={saving || !user} onClick={save} style={{ width: '100%', marginTop: 14 }}>{saving ? 'Guardando…' : 'Guardar y continuar'}</Button>
      <button className="textbtn" onClick={() => navigate('/home')} style={{ display: 'block', margin: '16px auto' }}>Ahora no</button>
    </div>
  )
}
