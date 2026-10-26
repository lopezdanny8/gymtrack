import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const sexLabels = { male: 'Masculino', female: 'Femenino' }
const objectiveLabels = { hypertrophy: 'Ganar músculo', strength: 'Ganar fuerza', fat_loss: 'Perder grasa', conditioning: 'Mejorar condición' }
const equipmentLabels = { bodyweight: 'Peso corporal', dumbbell: 'Mancuernas', barbell: 'Barra y discos', machines: 'Máquinas', cables: 'Poleas', bands: 'Bandas' }

function Value({ label, value }) {
  return <div className="summary-value"><span>{label}</span><strong>{value || 'Sin completar'}</strong></div>
}

export default function GymTrackSummary() {
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/api/gymtrack/assessment')
      .then(body => { if (active) setAssessment(body?.assessment || {}) })
      .catch(e => { if (active) setError(e?.status === 401 ? 'Inicia sesión para consultar tu evaluación.' : 'No pudimos cargar tu evaluación.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <div className="narrow"><div className="empty">Cargando tu resumen…</div></div>
  if (error) return <div className="narrow"><div className="card" role="alert" style={{ color: 'var(--red)' }}>{error}</div></div>

  const profile = assessment?.profile || {}
  const experience = assessment?.experience || {}
  const availability = assessment?.availability || {}
  const parq = assessment?.parqSummary || {}
  const days = Array.isArray(availability.days) ? availability.days.map(day => dayNames[day]).join(', ') : ''
  const equipment = Array.isArray(availability.equipment) ? availability.equipment.map(item => equipmentLabels[item] || item).join(', ') : ''

  return (
    <div className="narrow">
      <div className="hdr">
        <div>
          <div className="eyebrow">PASO 5 DE 5</div>
          <h1>Revisa tu evaluación</h1>
          <div className="sub">Comprueba que todo esté correcto antes de continuar.</div>
        </div>
        <button className="iconbtn" onClick={() => navigate('/home')} aria-label="Cerrar"><Icon name="xmark" /></button>
      </div>

      <section className="summary-section">
        <div className="row between summary-heading"><h2>Perfil físico</h2><button onClick={() => navigate('/onboarding/profile')}>Editar</button></div>
        <div className="card summary-card">
          <Value label="Fecha de nacimiento" value={profile.birthDate} />
          <Value label="Sexo" value={sexLabels[profile.biologicalSex]} />
          <Value label="Talla" value={profile.heightCm ? `${profile.heightCm} cm` : ''} />
          <Value label="Peso" value={profile.weightKg ? `${profile.weightKg} kg` : ''} />
        </div>
      </section>

      <section className="summary-section">
        <div className="row between summary-heading"><h2>Seguridad</h2><button onClick={() => navigate('/onboarding/parq')}>Editar</button></div>
        <div className="card summary-card"><Value label="PAR-Q" value={parq.complete ? (parq.hasPositive ? 'Completado con respuestas para revisar' : 'Completado sin respuestas positivas') : `Faltan ${parq.missing?.length || 0} respuestas`} /></div>
      </section>

      <section className="summary-section">
        <div className="row between summary-heading"><h2>Experiencia y objetivo</h2><button onClick={() => navigate('/onboarding/experience')}>Editar</button></div>
        <div className="card summary-card">
          <Value label="Experiencia" value={Number.isFinite(experience.months) ? `${experience.months} meses` : ''} />
          <Value label="Objetivo" value={objectiveLabels[assessment.objective] || assessment.objective} />
        </div>
      </section>

      <section className="summary-section">
        <div className="row between summary-heading"><h2>Disponibilidad</h2><button onClick={() => navigate('/onboarding/availability')}>Editar</button></div>
        <div className="card summary-card">
          <Value label="Frecuencia" value={availability.daysPerWeek ? `${availability.daysPerWeek} días por semana` : ''} />
          <Value label="Días" value={days} />
          <Value label="Sesión" value={availability.minutes ? `${availability.minutes} minutos desde las ${availability.startTime || '—'}` : ''} />
          <Value label="Sueño" value={Number.isFinite(availability.sleepHours) ? `${availability.sleepHours} horas` : ''} />
          <Value label="Equipamiento" value={equipment} />
        </div>
      </section>

      <div className="card small muted">Tu nivel todavía no se ha calculado. GymTrack lo hará después de confirmar las reglas de evaluación.</div>
      <Button variant="primary" onClick={() => navigate('/home')} style={{ width: '100%', marginTop: 8 }}>Confirmar evaluación</Button>
      <button className="textbtn" onClick={() => navigate('/home')} style={{ display: 'block', margin: '16px auto' }}>Ahora no</button>
    </div>
  )
}
