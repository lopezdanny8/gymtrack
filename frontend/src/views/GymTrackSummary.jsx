import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const sexLabels = { male: 'Masculino', female: 'Femenino' }
const objectiveLabels = {
  hypertrophy: 'Ganar músculo',
  strength: 'Ganar fuerza',
  recomposition: 'Recomposición',
  performance: 'Rendimiento',
  fat_loss: 'Perder grasa',
  conditioning: 'Mejorar condición',
}
const levelLabels = { intermediate: 'Intermedio', advanced: 'Avanzado' }
const criterionLabels = [
  ['experience', 'Experiencia'],
  ['frequency', 'Frecuencia actual'],
  ['relativeStrength', 'Fuerza relativa'],
  ['progression', 'Progresión'],
]
const progressionLabels = {
  no_log: 'Sin registro',
  tracks_loads: 'Registro mis cargas',
  plan_with_rpe: 'Plan con RPE',
  follows_plan: 'Sigo un plan (respuesta anterior)',
  new_to_training: 'Estoy empezando (respuesta anterior)',
}
const equipmentLabels = { bodyweight: 'Peso corporal', dumbbell: 'Mancuernas', barbell: 'Barra y discos', machines: 'Máquinas', cables: 'Poleas', bands: 'Bandas' }
const eligibilityReasonLabels = {
  'training-duration-under-6-months': 'Necesitas al menos 6 meses entrenando con regularidad.',
  'training-frequency-under-2-days': 'Necesitas entrenar actualmente al menos 2 días por semana.',
}
const eligibilityMissingLabels = { months: 'meses entrenando', trainingDaysPerWeek: 'días de entrenamiento actual por semana' }
const entryGateReasonLabels = {
  'eligibility-data-incomplete': 'Falta registrar la experiencia y los días que entrenas actualmente para revisar el requisito de ingreso.',
  'training-duration-under-6-months': eligibilityReasonLabels['training-duration-under-6-months'],
  'training-frequency-under-2-days': eligibilityReasonLabels['training-frequency-under-2-days'],
  'parq-incomplete': 'Completa todas las preguntas del PAR-Q antes de recibir una rutina.',
}

function Value({ label, value }) {
  const empty = value === null || value === undefined || value === ''
  return <div className="summary-value"><span>{label}</span><strong>{empty ? 'Sin completar' : value}</strong></div>
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
  const eligibility = assessment?.eligibility || { status: 'pending', eligible: null, missing: ['months', 'trainingDaysPerWeek'], reasons: [] }
  const fallbackBlockingReasons = [
    ...(eligibility.status === 'pending' ? ['eligibility-data-incomplete'] : eligibility.status === 'ineligible' ? (eligibility.reasons || []) : []),
    ...(!parq.complete ? ['parq-incomplete'] : []),
  ]
  const fallbackPassed = eligibility.status === 'eligible' && parq.complete === true
  const planEntryGate = assessment?.planEntryGate || {
    status: eligibility.status === 'pending' ? 'pending' : fallbackPassed ? 'passed' : 'blocked',
    passed: eligibility.status === 'pending' ? null : fallbackPassed,
    blockingReasons: fallbackBlockingReasons,
    requiresLimitedIntensity: parq.hasPositive === true,
    consultationRecommended: parq.hasPositive === true,
  }
  const bestSet = experience.benchPressBestSet
  const levelStatus = assessment?.levelStatus || 'pending-inputs'
  const levelValue = levelStatus === 'provisional'
    ? 'Intermedio provisional'
    : levelStatus === 'ineligible' ? 'No elegible todavía'
      : levelLabels[assessment?.level] || 'Pendiente'
  const pointsValue = Number.isInteger(assessment?.levelPoints)
    ? `${assessment.levelPoints}/8`
    : levelStatus === 'provisional' ? 'Pendiente de serie válida' : 'Pendiente'
  const benchEstimate = assessment?.benchPressEstimate || {}
  const levelCriteria = assessment?.criteria || {}
  const days = Array.isArray(availability.days) ? availability.days.map(day => dayNames[day]).join(', ') : ''
  const equipment = Array.isArray(availability.equipment) ? availability.equipment.map(item => equipmentLabels[item] || item).join(', ') : ''
  const bestSetLabel = Number.isFinite(bestSet?.weightKg) && Number.isInteger(bestSet?.reps)
    ? `${bestSet.weightKg} kg × ${bestSet.reps} repeticiones`
    : ''
  const planEntryMessage = planEntryGate.status === 'passed'
    ? planEntryGate.requiresLimitedIntensity
      ? 'Cumples los requisitos de ingreso y el PAR-Q está completo. Cuando se genere, la rutina debe comenzar con intensidad limitada; se recomienda consultar a un profesional de salud.'
      : levelStatus === 'scored'
        ? 'Cumples los requisitos de ingreso y completaste el PAR-Q. Tu nivel está calculado; la rutina personalizada aún no se ha generado.'
        : levelStatus === 'provisional'
          ? 'Cumples los requisitos de ingreso y completaste el PAR-Q. Tu nivel es intermedio provisional hasta registrar una serie válida de press.'
          : 'Cumples los requisitos de ingreso y completaste el PAR-Q. Completa los datos P7 pendientes para calcular tu nivel.'
    : (planEntryGate.blockingReasons || []).map(reason => {
      if (reason === 'eligibility-data-incomplete') {
        return `Falta registrar ${((eligibility.missing || []).map(field => eligibilityMissingLabels[field]).filter(Boolean)).join(' y ')} para revisar el requisito de ingreso.`
      }
      return entryGateReasonLabels[reason]
    }).filter(Boolean).join(' ')

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
          <Value label="Entrenas actualmente" value={Number.isInteger(experience.trainingDaysPerWeek) ? `${experience.trainingDaysPerWeek} días por semana` : ''} />
          <Value label="Mejor serie reciente de press de banca" value={bestSetLabel} />
          <Value label="Cómo progresas" value={progressionLabels[experience.progressionMode] || experience.progressionMode} />
          <Value label="Objetivo" value={objectiveLabels[assessment.objective] || assessment.objective} />
        </div>
      </section>

      <section className="summary-section">
        <div className="row between summary-heading"><h2>Disponibilidad</h2><button onClick={() => navigate('/onboarding/availability')}>Editar</button></div>
        <div className="card summary-card">
          <Value label="Días disponibles" value={Number.isInteger(availability.daysPerWeek) ? `${availability.daysPerWeek} días por semana` : ''} />
          <Value label="Días" value={days} />
          <Value label="Sesión" value={availability.minutes ? `${availability.minutes} minutos desde las ${availability.startTime || '–'}` : ''} />
          <Value label="Sueño" value={Number.isFinite(availability.sleepHours) ? `${availability.sleepHours} horas` : ''} />
          <Value label="Equipamiento" value={equipment} />
        </div>
      </section>

      <div className="card small muted" role="status">{planEntryMessage}</div>
      <section className="summary-section" style={{ marginTop: 12 }}>
        <div className="summary-heading"><h2>Nivel estimado</h2></div>
        <div className="card summary-card">
          <Value label="Nivel" value={levelValue} />
          <Value label="Puntaje" value={pointsValue} />
          <Value label="1RM estimado de banca" value={Number.isFinite(benchEstimate.estimated1RMKg) ? `${benchEstimate.estimated1RMKg} kg` : ''} />
          <Value label="Ratio respecto a tu peso" value={Number.isFinite(benchEstimate.bodyweightRatio) ? `${benchEstimate.bodyweightRatio}×` : ''} />
          {criterionLabels.map(([key, label]) => (
            <Value key={key} label={label} value={Number.isInteger(levelCriteria[key]) ? `${levelCriteria[key]}/2` : ''} />
          ))}
          <div className="small muted" style={{ gridColumn: '1 / -1', marginTop: 4 }}>{assessment?.levelExplanation || 'El servidor calculará el nivel cuando estén disponibles los datos necesarios.'}</div>
        </div>
      </section>
      <div className="card small muted" style={{ marginTop: 8 }}>La primera rutina semanal personalizada aún está pendiente de generación.</div>
      <Button variant="primary" onClick={() => navigate('/home')} style={{ width: '100%', marginTop: 8 }}>Confirmar evaluación</Button>
      <button className="textbtn" onClick={() => navigate('/home')} style={{ display: 'block', margin: '16px auto' }}>Ahora no</button>
    </div>
  )
}
