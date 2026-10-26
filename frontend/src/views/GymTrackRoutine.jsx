import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import { applyGymTrackPlan, getPlanApplicationPreview } from '../lib/gymtrack-apply.js'
import { exOr } from '../lib/exercises.js'
import { exerciseNameFor, exerciseNameClass } from '../lib/i18n.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { startFlow } from '../sheets.jsx'
import './gymtrack-routine.css'

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const OBJECTIVES = {
  hypertrophy: 'Ganar músculo',
  strength: 'Ganar fuerza',
  recomposition: 'Recomposición',
  performance: 'Rendimiento',
}
const LEVELS = { intermediate: 'Intermedio', advanced: 'Avanzado' }
const EQUIPMENT = {
  bodyweight: 'Peso corporal', dumbbell: 'Mancuernas', barbell: 'Barra y discos',
  machines: 'Máquinas', cables: 'Poleas', bands: 'Bandas',
}
const SPLITS = {
  'full-body-2': 'Cuerpo completo · 2 días',
  'upper-lower-2': 'Superior / inferior · 2 días',
  'full-body': 'Cuerpo completo · 3 días',
  ppl: 'Empuje / jalón / piernas',
  'upper-lower': 'Superior / inferior',
  'mixed-5': 'Mixto · 5 días',
  'ppl-2x': 'Empuje / jalón / piernas · 2 vueltas',
}
const MISSING_FIELDS = { months: 'meses entrenando', trainingDaysPerWeek: 'días de entrenamiento actual por semana' }
const GATE_REASONS = {
  'training-duration-under-6-months': 'Necesitas al menos 6 meses entrenando con regularidad.',
  'training-frequency-under-2-days': 'Necesitas entrenar actualmente al menos 2 días por semana.',
  'parq-incomplete': 'Completa todas las preguntas del PAR-Q antes de generar una rutina.',
}

function levelLabel(plan) {
  return plan?.levelStatus === 'provisional'
    ? 'Intermedio provisional'
    : LEVELS[plan?.level] || 'Pendiente'
}

function gateMessages(assessment) {
  const gate = assessment?.planEntryGate
  const reasons = Array.isArray(gate?.blockingReasons) ? gate.blockingReasons : []
  const messages = reasons.map(reason => {
    if (reason === 'eligibility-data-incomplete') {
      const missing = (assessment?.eligibility?.missing || []).map(field => MISSING_FIELDS[field]).filter(Boolean)
      return missing.length
        ? `Falta registrar ${missing.join(' y ')} para revisar el requisito de ingreso.`
        : 'Completa tu experiencia y la frecuencia de entrenamiento actual.'
    }
    return GATE_REASONS[reason] || ''
  }).filter(Boolean)
  if (messages.length) return messages
  if (gate?.status === 'passed') return []
  return ['Completa o revisa tu evaluación antes de generar la rutina.']
}

function exerciseName(id) {
  const exercise = exOr(id)
  return exercise ? exerciseNameFor(exercise) : `Ejercicio ${id || ''}`
}

function errorState(error) {
  return {
    message: error?.data?.error || error?.message || 'No pudimos generar la rutina. Inténtalo de nuevo.',
    code: error?.data?.code || error?.code || '',
    gate: error?.data?.gate || null,
    currentPlan: error?.data?.currentPlan || null,
  }
}

function Notice({ tone = 'info', title, children, ...rest }) {
  return <div className="card gt-callout" data-tone={tone} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} {...rest}>
    {title && <strong>{title}</strong>}
    {children}
  </div>
}

function SummaryValue({ label, value }) {
  return <div className="summary-value"><span>{label}</span><strong>{value || 'Sin completar'}</strong></div>
}

export default function GymTrackRoutine() {
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [plan, setPlan] = useState(null)
  const [stale, setStale] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [requestError, setRequestError] = useState(null)
  const [applyConfirmation, setApplyConfirmation] = useState(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [firstRoutineId, setFirstRoutineId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    Promise.all([api('/api/gymtrack/plan'), api('/api/gymtrack/assessment')])
      .then(([planBody, assessmentBody]) => {
        if (!active) return
        setPlan(planBody?.plan || null)
        setStale(planBody?.stale === true)
        setAssessment(assessmentBody?.assessment || null)
        setRequestError(null)
      })
      .catch(error => {
        if (!active) return
        setLoadError(error?.status === 401
          ? 'Tu sesión no está disponible. Inicia sesión para consultar tu plan.'
          : 'No pudimos cargar tu plan y evaluación. Revisa tu conexión e inténtalo de nuevo.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const retryLoad = () => {
    setLoading(true)
    setLoadError('')
    setReloadKey(key => key + 1)
  }

  const generate = async (regenerate = false) => {
    setGenerating(true)
    setRequestError(null)
    try {
      const options = { method: 'POST' }
      if (regenerate) options.body = JSON.stringify({ regenerate: true })
      const body = await api('/api/gymtrack/plan', options)
      setPlan(body?.plan || null)
      setStale(body?.stale === true)
      setRequestError(null)
    } catch (error) {
      const problem = errorState(error)
      setRequestError(problem)
      if (problem.gate) setAssessment(current => ({ ...(current || {}), planEntryGate: problem.gate }))
      if (problem.code === 'plan-stale' && problem.currentPlan) {
        setPlan(problem.currentPlan)
        setStale(true)
      }
    } finally { setGenerating(false) }
  }

  const commitApply = () => {
    let result
    useStore.getState().update(state => { result = applyGymTrackPlan(state, plan) })
    if (!result?.ok) {
      setRequestError({ message: result?.code === 'review-required' ? 'Este borrador requiere revisión profesional y no se puede aplicar.' : 'No pudimos aplicar esta rutina.' })
      return
    }
    setApplyConfirmation(null)
    setFirstRoutineId(result.firstRoutineId)
    setApplyMessage(`Plan aplicado a ${result.days.length} ${result.days.length === 1 ? 'día' : 'días'} de tu semana.`)
  }

  const apply = () => {
    if (!plan || stale || plan.status === 'review_required' || plan.reviewRequired === true || plan.activationAllowed === false) return
    const preview = getPlanApplicationPreview(plan, useStore.getState().S)
    if (preview.collisions.length) {
      setApplyConfirmation(preview)
      setApplyMessage('')
      return
    }
    commitApply()
  }

  if (loading) return <div className="narrow gt-routine"><div className="empty">Cargando tu rutina…</div></div>

  if (loadError) return <div className="narrow gt-routine">
    <div className="hdr">
      <div><div className="eyebrow">GYMTRACK</div><h1>Tu rutina semanal</h1></div>
      <button className="iconbtn" onClick={() => navigate('/onboarding/summary')} aria-label="Volver al resumen"><Icon name="chevronLeft" /></button>
    </div>
    <Notice tone="danger" title="No se pudo cargar">{loadError}</Notice>
    <Button variant="primary" onClick={retryLoad} style={{ width: '100%' }}>Reintentar</Button>
  </div>

  const gate = assessment?.planEntryGate
  const gatePassed = gate?.status === 'passed'
  const levelReady = ['scored', 'provisional'].includes(assessment?.levelStatus)
  const canGenerate = gatePassed && levelReady
  const requiresReview = plan?.status === 'review_required' || plan?.reviewRequired === true || gate?.requiresLimitedIntensity === true
  const parqComplete = assessment?.parqSummary?.complete === true
  const needsExperience = assessment?.eligibility?.status !== 'eligible'
  const reasons = gateMessages(assessment)
  const objectiveLabel = OBJECTIVES[plan?.objective] || plan?.objective || 'Pendiente'
  const equipmentLabel = (plan?.equipment || []).map(item => EQUIPMENT[item] || item).join(', ')
  const routineById = new Map((plan?.routines || []).map(routine => [routine.id, routine]))
  const schedule = (plan?.schedule || []).map(slot => ({ ...slot, routine: routineById.get(slot.routineId) })).filter(slot => slot.routine)
  const repMin = plan?.prescription?.reps?.min
  const repMax = plan?.prescription?.reps?.max
  const repLabel = Number.isInteger(repMin) && Number.isInteger(repMax)
    ? repMin === repMax ? `${repMin} repeticiones` : `${repMin}–${repMax} repeticiones`
    : null

  return <div className="narrow gt-routine">
    <div className="hdr">
      <div>
        <div className="eyebrow">GYMTRACK · PLAN PERSONALIZADO</div>
        <h1>Tu rutina semanal</h1>
        <div className="sub">Una vista previa creada a partir de tu evaluación.</div>
      </div>
      <button className="iconbtn" onClick={() => navigate('/onboarding/summary')} aria-label="Volver al resumen"><Icon name="chevronLeft" /></button>
    </div>

    {requestError && <Notice tone="danger" title="No pudimos completar la solicitud">
      <p>{requestError.message}</p>
      {requestError.code === 'no-compatible-template' && <button className="textbtn" onClick={() => navigate('/onboarding/availability')}>Ajustar disponibilidad o equipo</button>}
      {requestError.code === 'assessment-missing' && <button className="textbtn" onClick={() => navigate('/onboarding/summary')}>Revisar evaluación</button>}
    </Notice>}

    {requiresReview && <Notice tone="warning" data-gt-review title="PAR-Q: requiere revisión profesional">
      {plan?.status === 'review_required' || plan?.reviewRequired
        ? <p>Este es un borrador de baja intensidad. No se puede activar ni aplicar antes de una revisión profesional; GymTrack no sustituye una valoración de salud.</p>
        : <p>Al generar la rutina se guardará como borrador de baja intensidad y quedará pendiente de revisión profesional. No se activará automáticamente.</p>}
      {plan?.prescription && <p className="small muted">Prescripción limitada: {plan.prescription.setsPerExercise?.min}–{plan.prescription.setsPerExercise?.max} series, {repLabel}, RPE máximo {plan.prescription.targetRpeMax}; progresión automática desactivada.</p>}
    </Notice>}

    {stale && plan && <Notice tone="warning" data-gt-stale title="La evaluación cambió">
      <p>Esta rutina se generó con una versión anterior de tus datos y ya no representa tu evaluación actual.</p>
      {canGenerate
        ? <Button variant="primary" disabled={generating} onClick={() => generate(true)}>{generating ? 'Actualizando…' : 'Regenerar rutina'}</Button>
        : <div className="gt-plan-actions">
          {!parqComplete && <Button variant="plain" onClick={() => navigate('/onboarding/parq')}>Completar PAR-Q</Button>}
          {needsExperience && <Button variant="plain" onClick={() => navigate('/onboarding/experience')}>Revisar experiencia</Button>}
        </div>}
    </Notice>}

    {!plan && !canGenerate && <section className="card gt-gate" role="status">
      <h2>Faltan requisitos para generar la rutina</h2>
      <ul>{reasons.map((message, index) => <li key={`${index}-${message}`}>{message}</li>)}</ul>
      {gatePassed && !levelReady && <p>Completa los datos necesarios para calcular tu nivel antes de crear el plan.</p>}
      <div className="gt-plan-actions">
        {!parqComplete && <Button variant="plain" onClick={() => navigate('/onboarding/parq')}>Completar PAR-Q</Button>}
        {needsExperience && <Button variant="plain" onClick={() => navigate('/onboarding/experience')}>Revisar experiencia</Button>}
        {gatePassed && !levelReady && <Button variant="plain" onClick={() => navigate('/onboarding/experience')}>Completar experiencia</Button>}
        {!assessment && <Button variant="plain" onClick={() => navigate('/onboarding/summary')}>Abrir evaluación</Button>}
      </div>
    </section>}

    {!plan && canGenerate && <section className="card gt-plan-empty">
      <div className="eyebrow">SIGUIENTE PASO</div>
      <h2>Genera tu primera semana</h2>
      <p className="small muted">Usaremos tu nivel calculado en el servidor, objetivo, días disponibles y equipo. La rutina se guardará por separado y no cambiará tu semana activa.</p>
      <Button variant="primary" disabled={generating} onClick={() => generate(false)} style={{ width: '100%' }}>
        {generating ? 'Generando rutina…' : 'Generar mi rutina'}
      </Button>
    </section>}

    {plan && <>
      <Notice title={stale ? 'Vista previa desactualizada' : 'Vista previa'}>
        Esta rutina está guardada por separado; consultar o regenerar el plan no modifica tu semana activa.
      </Notice>
      {applyMessage && <Notice data-gt-applied title="Plan aplicado">
        <p>{applyMessage} Las rutinas existentes, los días no seleccionados y el modo de rotación se conservaron.</p>
        {firstRoutineId && <Button variant="primary" data-gt-start-first onClick={() => {
          if (useStore.getState().S.active) navigate('/workout')
          else startFlow([firstRoutineId])
        }}>Iniciar primera sesión</Button>}
      </Notice>}
      {!requiresReview && !stale && <section className="card gt-apply" data-gt-apply>
        <div className="eyebrow">SEMANA ACTIVA</div>
        <h2>Aplicar esta rutina</h2>
        <p>Agrega las rutinas del plan y programa únicamente tus días P9. No cambiaremos el modo de rotación.</p>
        {applyConfirmation ? <div className="gt-apply-confirm" data-gt-apply-confirm role="alert">
          <strong>Hay días con rutinas existentes</strong>
          <p>Al confirmar, esos días se reprogramarán con el plan GymTrack. Las rutinas existentes seguirán guardadas y los demás días no cambiarán.</p>
          <ul>{applyConfirmation.collisions.map(slot => <li key={slot.day}>{DAY_NAMES[slot.day]}{slot.existingRoutineIds.length > 1 ? ` (${slot.existingRoutineIds.length} rutinas)` : ''}</li>)}</ul>
          <div className="gt-plan-actions">
            <Button variant="primary" onClick={commitApply}>Confirmar aplicación</Button>
            <Button variant="plain" onClick={() => setApplyConfirmation(null)}>Cancelar</Button>
          </div>
        </div> : <Button variant="primary" onClick={apply} data-gt-apply-button style={{ width: '100%' }}>Aplicar Plan</Button>}
      </section>}
      <section className="summary-section">
        <div className="summary-heading"><h2>Tu enfoque</h2></div>
        <div className="card summary-card">
          <SummaryValue label="Nivel calculado por el servidor" value={levelLabel(plan)} />
          <SummaryValue label="Puntaje" value={Number.isInteger(plan.levelPoints) ? `${plan.levelPoints}/8` : plan.levelStatus === 'provisional' ? 'Provisional' : 'Pendiente'} />
          <SummaryValue label="Objetivo" value={objectiveLabel} />
          <SummaryValue label="Frecuencia" value={`${plan.daysPerWeek} días por semana`} />
          <SummaryValue label="Duración disponible" value={Number.isInteger(plan.sessionMinutes) ? `${plan.sessionMinutes} minutos` : ''} />
          <SummaryValue label="Split seleccionado" value={SPLITS[plan.template?.split] || plan.template?.split} />
          <div className="summary-value" style={{ gridColumn: '1 / -1' }}><span>Equipamiento disponible</span><strong>{equipmentLabel || 'Peso corporal'}</strong></div>
        </div>
      </section>

      <section className="summary-section">
        <div className="summary-heading"><h2>Ciclo de entrenamiento</h2></div>
        <div className="gt-phase-grid">
          {(plan.cycle?.weeks || []).map(week => <article className="gt-phase" data-phase={week.phase} key={week.week}>
            <div className="eyebrow">{week.phase === 'review' ? 'REVISIÓN' : `SEMANA ${week.week}`}</div>
            <h3>{week.label}</h3>
            {Number.isFinite(week.volumePercent) && <div className="small muted">Volumen: {week.volumePercent}%</div>}
            <p className="small muted">{week.note}</p>
          </article>)}
        </div>
        {plan.cycle?.progressionRule?.note && <div className="card small muted gt-progression-note">
          <strong>Doble progresión</strong><br />{plan.cycle.progressionRule.note}
        </div>}
      </section>

      {plan.duration && <section className="summary-section" data-gt-duration>
        <div className="summary-heading"><h2>Duración de la sesión</h2></div>
        <div className="card gt-duration-card">
          <p className="small muted">Estimación: {plan.duration.estimatedMinutes || '–'} minutos{Number.isInteger(plan.duration.targetMinutes) ? ` de ${plan.duration.targetMinutes} disponibles` : ''}.</p>
          {plan.duration.adjusted
            ? <>
              <strong>Volumen ajustado para caber en tu tiempo disponible.</strong>
              <ul className="small muted">{(plan.duration.changes || []).map(change => <li key={change.routineId}>{change.routineName}: {change.reducedSets ? `${change.reducedSets} series menos` : ''}{change.reducedSets && change.removedExercises?.length ? ' y ' : ''}{change.removedExercises?.length ? `${change.removedExercises.length} ejercicios accesorios menos` : ''}.</li>)}</ul>
            </>
            : <p className="small muted">El volumen base cabe en la duración que indicaste.</p>}
        </div>
      </section>}

      <section className="summary-section">
        <div className="summary-heading"><h2>Semana personalizada</h2></div>
        {schedule.map(slot => <article className="card gt-routine-day" key={`${slot.day}-${slot.routine.id}`}>
          <div className="row between gt-routine-day-heading">
            <div><div className="eyebrow">{DAY_NAMES[slot.day] || slot.dayName}</div><h3>{slot.routine.name}</h3></div>
            <span className="small muted">{slot.routine.ex?.length || 0} ejercicios</span>
          </div>
          <div className="gt-exercise-list">
            {(slot.routine.ex || []).map((exercise, index) => {
              const record = exOr(exercise.id)
              const reps = repLabel || `${exercise.reps} repeticiones`
              return <div className="gt-exercise-row" key={`${exercise.id}-${index}`}>
                <div className="gt-exercise-name">
                  <strong className={record ? exerciseNameClass(record) : undefined}>{exerciseName(exercise.id)}</strong>
                  <div className="small muted">{exercise.sets} {exercise.sets === 1 ? 'serie' : 'series'} × {reps}</div>
                </div>
              </div>
            })}
          </div>
        </article>)}
      </section>

      <section className="summary-section">
        <div className="summary-heading"><h2>Ajustes por equipamiento</h2></div>
        <div className="card">
          {plan.adaptations?.details?.length
            ? <>
              <p className="small muted">{plan.adaptations.swapped || 0} sustituciones · {plan.adaptations.dropped || 0} ejercicios retirados por disponibilidad.</p>
              <div className="gt-adaptation-list">
                {plan.adaptations.details.map((item, index) => <div className="gt-adaptation" key={`${item.routineName}-${item.exerciseId}-${index}`}>
                  <strong>{item.routineName}</strong>
                  <div className="small muted">{item.type === 'substituted'
                    ? `${exerciseName(item.exerciseId)} → ${exerciseName(item.replacementId)}`
                    : `${exerciseName(item.exerciseId)} no está disponible con el equipo seleccionado.`}</div>
                </div>)}
              </div>
            </>
            : <p className="small muted">No se necesitaron sustituciones ni retiros para esta selección de equipo.</p>}
        </div>
      </section>

      {Array.isArray(plan.notes) && plan.notes.length > 0 && <section className="summary-section">
        <div className="summary-heading"><h2>Notas</h2></div>
        <div className="card small muted"><ul>{plan.notes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}</ul></div>
      </section>}
    </>}

    <button className="textbtn" onClick={() => navigate('/onboarding/summary')} style={{ display: 'block', margin: '16px auto' }}>Volver al resumen</button>
  </div>
}
