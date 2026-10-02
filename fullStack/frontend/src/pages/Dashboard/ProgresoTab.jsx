export default function ProgresoTab({ adherencia, perfil }) {
  const peso   = perfil?.perfil?.peso ?? null
  const semana = adherencia?.semana ?? []

  // Barras por día de la semana actual (dato real, viene de /checkins/semana).
  // Todavía no hay histórico de semanas anteriores, así que no se inventan
  // ceros: un día sin checkin se muestra vacío ('—'), no como 0%.
  const barras = semana.map(({ fecha, checkin }) => ({
    label: new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'short' }),
    valor: checkin ? Math.round((checkin.puntajeTotal / 2) * 100) : null,
  }))

  return (
    <div className="prog-wrap">
      {/* Adherencia — barras */}
      <section className="prog-section">
        <h3 className="prog-title">Adherencia de esta semana</h3>
        {barras.length > 0 ? (
          <div className="prog-barras">
            {barras.map(({ label, valor }, i) => {
              const color = valor == null
                ? 'rgba(255,255,255,0.1)'
                : valor >= 70 ? '#00E887' : valor >= 50 ? '#F59E0B' : '#EF4444'
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
          <p className="prog-empty">Todavía no tenés registros de adherencia.</p>
        )}
      </section>

      {/* Peso */}
      <section className="prog-section">
        <h3 className="prog-title">Peso registrado</h3>
        {peso ? (
          <div className="prog-peso-card">
            <span className="prog-peso-val">{peso} kg</span>
            <span className="prog-peso-sub">Peso inicial registrado en tu perfil</span>
          </div>
        ) : (
          <p className="prog-empty">No hay datos de peso registrados.</p>
        )}
      </section>
    </div>
  )
}
