const LABELS = Object.freeze({ green: 'Verde', yellow: 'Amarillo', red: 'Rojo' })

/**
 * Conservative readiness signal for the Web summary. It recommends a safer decision; it never
 * diagnoses, clears PAR-Q concerns, or edits a routine. Missing safety inputs stay visible.
 */
export function gymTrackReadiness({ fatigueMax = 0, sleepHours = null, painLevel = null, parqComplete = false, parqPositive = false } = {}) {
  const reasons = []
  let color = 'green'
  const raise = next => {
    const rank = { green: 0, yellow: 1, red: 2 }
    if (rank[next] > rank[color]) color = next
  }

  if (!parqComplete) {
    raise('red')
    reasons.push('Completa el PAR-Q antes de interpretar la intensidad.')
  } else if (parqPositive) {
    raise('yellow')
    reasons.push('El PAR-Q tiene una respuesta para revisar con un profesional.')
  }
  if (painLevel == null) {
    raise('yellow')
    reasons.push('No hay un reporte de dolor para esta sesión.')
  } else if (painLevel >= 7) {
    raise('red')
    reasons.push('El dolor reportado es intenso; no entrenes esa zona y busca orientación profesional.')
  } else if (painLevel > 0) {
    raise('yellow')
    reasons.push('Hay dolor reportado; reduce o detén los movimientos que lo reproduzcan.')
  }
  if (fatigueMax > 0.5) {
    raise('red')
    reasons.push('La recuperación calculada está baja en al menos un grupo muscular.')
  } else if (fatigueMax >= 0.25) {
    raise('yellow')
    reasons.push('Todavía hay recuperación pendiente en parte de la musculatura.')
  }
  if (sleepHours == null) {
    raise('yellow')
    reasons.push('Faltan horas de sueño para completar la señal.')
  } else if (sleepHours < 6) {
    raise('red')
    reasons.push('Dormiste menos de seis horas; prioriza recuperar antes de una sesión intensa.')
  } else if (sleepHours < 7) {
    raise('yellow')
    reasons.push('El sueño está por debajo de siete horas; considera reducir la intensidad.')
  }

  return { color, label: LABELS[color], reasons }
}

export const readinessLabel = color => LABELS[color] || LABELS.yellow
