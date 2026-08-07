const SEMANAS = ['Hace 4 sem', 'Hace 3 sem', 'Hace 2 sem', 'Esta sem']

export default function ProgresoTab({ adherencia, perfil }) {
  const peso = perfil?.perfil?.peso ?? null

  // Por ahora la adherencia semanal la tomamos como dato actual
  // Cuando haya histórico, esto vendrá de la API
  const barras = [
    { label: SEMANAS[0], valor: 0 },
    { label: SEMANAS[1], valor: 0 },
    { label: SEMANAS[2], valor: 0 },
    { label: SEMANAS[3], valor: adherencia?.porcentaje ?? 0 },
  ]

  const maxBar = 100

  return (
    <div className="prog-wrap">
      {/* Adherencia — barras */}
      <section className="prog-section">
        <h3 className="prog-title">Adherencia semanal</h3>
        <div className="prog-barras">
          {barras.map(({ label, valor }) => {
            const color = valor >= 70 ? '#00E887' : valor >= 50 ? '#F59E0B' : valor > 0 ? '#EF4444' : 'rgba(255,255,255,0.1)'
            return (
              <div key={label} className="prog-barra-col">
                <div className="prog-barra-track">
                  <div
                    className="prog-barra-fill"
                    style={{ height: `${(valor / maxBar) * 100}%`, background: color }}
                  />
                </div>
                <span className="prog-barra-val">{valor > 0 ? `${valor}%` : '—'}</span>
                <span className="prog-barra-label">{label}</span>
              </div>
            )
          })}
        </div>
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