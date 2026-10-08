import { useTranslation } from 'react-i18next'

export default function ProgresoTab({ adherencia, perfil }) {
  const { t, i18n } = useTranslation()
  const peso   = perfil?.perfil?.peso ?? null
  const semana = adherencia?.semana ?? []

  // Barras por día de la semana actual (dato real, viene de /checkins/semana).
  // Todavía no hay histórico de semanas anteriores, así que no se inventan
  // ceros: un día sin checkin se muestra vacío ('—'), no como 0%.
  const barras = semana.map(({ fecha, checkin }) => ({
    label: new Date(`${fecha}T00:00:00`).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-AR', { weekday: 'short' }),
    valor: checkin ? Math.round((checkin.puntajeTotal / 2) * 100) : null,
  }))

  return (
    <div className="prog-wrap">
      {/* Adherencia — barras */}
      <section className="prog-section">
        <h3 className="prog-title">{t('progreso.adherenciaTitulo')}</h3>
        {barras.length > 0 ? (
          <div className="prog-barras">
            {barras.map(({ label, valor }, i) => {
              const color = valor == null
                ? 'rgba(255,255,255,0.1)'
                : valor >= 70 ? 'var(--green)' : valor >= 50 ? 'var(--warn)' : 'var(--err)'
              return (
                <div key={`${label}-${i}`} className="prog-barra-col">
                  <div className="prog-barra-track">
                    <div
                      className="prog-barra-fill"
                      style={{ height: `${valor ?? 0}%`, background: color }}
                    />
                  </div>
                  <span className="prog-barra-val">{valor != null ? `${valor}%` : '—'}</span>
                  <span className="prog-barra-label">{label}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="prog-empty">{t('progreso.sinRegistros')}</p>
        )}
      </section>

      {/* Peso */}
      <section className="prog-section">
        <h3 className="prog-title">{t('progreso.pesoTitulo')}</h3>
        {peso ? (
          <div className="prog-peso-card">
            <span className="prog-peso-val">{peso} kg</span>
            <span className="prog-peso-sub">{t('progreso.pesoInicial')}</span>
          </div>
        ) : (
          <p className="prog-empty">{t('progreso.sinPeso')}</p>
        )}
      </section>
    </div>
  )
}
