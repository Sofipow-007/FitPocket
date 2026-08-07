import { useState } from 'react'

const OPCIONES = [
  { id: 'completado', label: 'Completado', color: '#00E887' },
  { id: 'parcial',    label: 'Parcial',    color: '#F59E0B' },
  { id: 'no_hice',   label: 'No hice',    color: '#EF4444' },
]

export default function ChecklistTab({ checkinHoy, onGuardado }) {
  const yaRegistro = !!checkinHoy

  const [rutina,  setRutina]  = useState(checkinHoy?.rutina?.estado  ?? null)
  const [dieta,   setDieta]   = useState(checkinHoy?.dieta?.estado   ?? null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleGuardar = async () => {
    if (!rutina || !dieta) { setError('Seleccioná ambas opciones antes de guardar.'); return }
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')
    try {
      const res  = await fetch('http://localhost:3000/checkin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ rutina, dieta })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onGuardado?.(data.checkin)
    } catch (e) {
      setError(e.message || 'No se pudo guardar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cl-wrap">
      <h2 className="cl-title">¿Cómo te fue hoy?</h2>
      <p className="cl-sub">
        {new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
      </p>

      {['rutina', 'dieta'].map(campo => {
        const val    = campo === 'rutina' ? rutina : dieta
        const setter = campo === 'rutina' ? setRutina : setDieta
        const label  = campo === 'rutina' ? '🏋️ Rutina de entrenamiento' : '🥗 Dieta del día'
        return (
          <div key={campo} className="cl-seccion">
            <span className="cl-seccion__label">{label}</span>
            <div className="cl-opciones">
              {OPCIONES.map(op => (
                <button
                  key={op.id}
                  className={`cl-btn${val === op.id ? ' cl-btn--on' : ''}${yaRegistro ? ' cl-btn--readonly' : ''}`}
                  style={val === op.id ? { borderColor: op.color, color: op.color } : {}}
                  onClick={() => !yaRegistro && setter(op.id)}
                  disabled={yaRegistro}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {error && <p className="cl-error" role="alert">{error}</p>}

      {yaRegistro ? (
        <p className="cl-guardado">✓ Ya registraste el día de hoy.</p>
      ) : (
        <button className="cl-guardar" onClick={handleGuardar} disabled={loading || !rutina || !dieta}>
          {loading ? 'Guardando...' : 'Guardar día'}
        </button>
      )}
    </div>
  )
}