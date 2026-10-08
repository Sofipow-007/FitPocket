import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../lib/api'
import './ChecklistTab.css'

const OPCIONES = [
  { id: 'completado', tKey: 'checklist.completado', color: 'var(--green)' },
  { id: 'parcial',    tKey: 'checklist.parcial',    color: 'var(--warn)' },
  { id: 'no_hice',    tKey: 'checklist.noHice',     color: 'var(--err)' },
]

export default function ChecklistTab({ checkinHoy, onGuardado }) {
  const { t, i18n } = useTranslation()
  const yaRegistro = !!checkinHoy

  const [rutina,  setRutina]  = useState(checkinHoy?.rutina?.estado  ?? null)
  const [dieta,   setDieta]   = useState(checkinHoy?.dieta?.estado   ?? null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleGuardar = async () => {
    if (!rutina || !dieta) { setError(t('checklist.errorOpciones')); return }
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')
    try {
      const res  = await fetch(`${API_URL}/checkins`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ rutina, dieta })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onGuardado?.(data.checkin)
    } catch (e) {
      setError(e.message || t('checklist.errorGuardar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cl-wrap">
      <h2 className="cl-title">{t('checklist.titulo')}</h2>
      <p className="cl-sub">
        {new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
      </p>

      {['rutina', 'dieta'].map(campo => {
        const val    = campo === 'rutina' ? rutina : dieta
        const setter = campo === 'rutina' ? setRutina : setDieta
        const label  = campo === 'rutina' ? t('checklist.rutina') : t('checklist.dieta')
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
                  {t(op.tKey)}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {error && <p className="cl-error" role="alert">{error}</p>}

      {yaRegistro ? (
        <p className="cl-guardado">{t('checklist.yaRegistrado')}</p>
      ) : (
        <button className="cl-guardar" onClick={handleGuardar} disabled={loading || !rutina || !dieta}>
          {loading ? t('checklist.guardando') : t('checklist.guardar')}
        </button>
      )}
    </div>
  )
}