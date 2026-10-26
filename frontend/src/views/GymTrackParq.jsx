import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import Icon from '../components/Icon.jsx'
import { Button, Segmented } from '../components/ui.jsx'

const QUESTIONS = [
  ['heart_condition', '¿Alguna vez un médico te ha dicho que tienes una afección cardíaca o que solo debes hacer actividad física recomendada por un médico?'],
  ['chest_pain_activity', '¿Sientes dolor en el pecho cuando haces actividad física?'],
  ['chest_pain_rest', '¿Durante el último mes has sentido dolor en el pecho cuando no estabas haciendo actividad física?'],
  ['dizziness', '¿Pierdes el equilibrio por mareo o has perdido el conocimiento?'],
  ['bone_joint', '¿Tienes algún problema óseo o articular que podría empeorar con un cambio en tu actividad física?'],
  ['medication', '¿Estás tomando actualmente algún medicamento para la presión arterial o para el corazón?'],
  ['other_reason', '¿Existe alguna otra razón por la que no deberías hacer actividad física?'],
]

export default function GymTrackParq() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    api('/api/gymtrack/assessment')
      .then(body => { if (active) setAnswers(body?.assessment?.parq || {}) })
      .catch(e => { if (active) setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos cargar tu evaluación.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const answered = QUESTIONS.filter(([id]) => typeof answers[id] === 'boolean').length
  const complete = answered === QUESTIONS.length
  const hasPositive = QUESTIONS.some(([id]) => answers[id] === true)

  const answer = async (id, value) => {
    const next = { ...answers, [id]: value }
    setAnswers(next); setError(''); setSaved(false); setSaving(id)
    try {
      await api('/api/gymtrack/assessment', { method: 'PUT', body: JSON.stringify({ parq: next }) })
      setSaved(true)
    } catch (e) {
      setError(e?.status === 401 ? 'Inicia sesión para guardar tu evaluación.' : 'No pudimos guardar esta respuesta. Inténtalo de nuevo.')
    } finally { setSaving(null) }
  }

  if (loading) return <div className="narrow"><div className="empty">Cargando tu evaluación…</div></div>

  return (
    <div className="narrow">
      <div className="hdr">
        <div>
          <div className="eyebrow">PASO 2 DE 5</div>
          <h1>PAR-Q</h1>
          <div className="sub">Responde con honestidad para adaptar el inicio de tu entrenamiento.</div>
        </div>
        <button className="iconbtn" onClick={() => navigate('/onboarding/profile')} aria-label="Volver"><Icon name="chevronLeft" /></button>
      </div>

      <div className="card small muted">Estas preguntas orientan el nivel de precaución. No sustituyen la valoración de un profesional de la salud.</div>

      {QUESTIONS.map(([id, question], index) => (
        <div className="card" key={id}>
          <div className="small muted" style={{ marginBottom: 8 }}>Pregunta {index + 1} de {QUESTIONS.length}</div>
          <div style={{ lineHeight: 1.4, marginBottom: 14 }}>{question}</div>
          <Segmented
            options={[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]}
            value={answers[id]}
            onChange={value => answer(id, value)}
          />
          {saving === id && <div className="dim small" style={{ marginTop: 8 }}>Guardando…</div>}
        </div>
      ))}

      {hasPositive && <div className="card small" role="status" style={{ color: 'var(--orange)' }}>
        Algunas respuestas indican que conviene revisar tu situación con un profesional antes de comenzar una actividad intensa.
      </div>}
      {error && <div className="card small" role="alert" style={{ color: 'var(--red)' }}>{error}</div>}
      {saved && !error && <div className="small" role="status" style={{ color: 'var(--green)', margin: '4px' }}>Avance guardado.</div>}

      <Button variant="primary" disabled={!complete || !!saving || !user} onClick={() => navigate('/onboarding/experience')} style={{ width: '100%', marginTop: 8 }}>
        {complete ? 'Continuar' : `Responde las ${QUESTIONS.length - answered} restantes`}
      </Button>
      <button className="textbtn" onClick={() => navigate('/home')} style={{ display: 'block', margin: '16px auto' }}>Ahora no</button>
    </div>
  )
}
