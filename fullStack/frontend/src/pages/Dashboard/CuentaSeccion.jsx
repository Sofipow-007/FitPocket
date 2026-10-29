import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../lib/api'
import ConPermiso from '../../components/ConPermiso'
import DialogoConfirmacion from '../../components/DialogoConfirmacion/DialogoConfirmacion'
import { invalidarPermisos } from '../../hooks/usePermisos'

// "Tu cuenta" al final de Progreso: el único lugar de la app donde el usuario
// puede borrar su propia cuenta (DELETE /users/borrar, patente cuenta.borrar).
export default function CuentaSeccion({ perfil }) {
  const { t }          = useTranslation()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const isPreview      = import.meta.env.DEV && searchParams.get('preview') === 'true'

  const [confirmar, setConfirmar] = useState(false)
  const [borrando,  setBorrando]  = useState(false)
  const [error,     setError]     = useState('')
  const botonRef = useRef(null)

  const cerrar = () => {
    setConfirmar(false)
    botonRef.current?.focus()
  }

  const salir = () => {
    localStorage.removeItem('token')
    invalidarPermisos()
    navigate('/', { replace: true })
  }

  const borrar = async () => {
    setBorrando(true)
    setError('')
    try {
      if (isPreview) { cerrar(); return } // en preview no hay cuenta real que borrar
      const res = await fetch(`${API_URL}/users/borrar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      // 401/404: la cuenta ya no existe; para el usuario es lo mismo que haberla borrado
      if (res.ok || res.status === 401 || res.status === 404) { salir(); return }
      setError(t(res.status === 403 ? 'cuenta.errorAdmin' : 'cuenta.errorBorrar'))
    } catch {
      setError(t('cuenta.errorBorrar'))
    } finally {
      setBorrando(false)
    }
  }

  return (
    <ConPermiso patente="cuenta.borrar">
      <section className="prog-section prog-cuenta" aria-labelledby="prog-cuenta-titulo">
        <h3 className="prog-title" id="prog-cuenta-titulo">{t('cuenta.titulo')}</h3>
        <div className="prog-cuenta__fila">
          <div className="prog-cuenta__datos">
            <span className="prog-cuenta__nombre">{perfil?.nombre ?? '—'}</span>
            <span className="prog-cuenta__email">{perfil?.email ?? ''}</span>
          </div>
          {perfil?.rol === 'admin' ? (
            <p className="prog-cuenta__nota">{t('cuenta.adminNoPuede')}</p>
          ) : (
            <button
              type="button"
              className="prog-cuenta__borrar"
              ref={botonRef}
              onClick={() => { setError(''); setConfirmar(true) }}
            >
              {t('cuenta.borrar')}
            </button>
          )}
        </div>

        {confirmar && (
          <DialogoConfirmacion
            titulo={t('cuenta.confirmarTitulo')}
            texto={t('cuenta.confirmarTexto')}
            error={error}
            ocupado={borrando}
            textoConfirmar={t('cuenta.confirmarBoton')}
            textoOcupado={t('cuenta.borrando')}
            peligro
            onCancel={cerrar}
            onConfirm={borrar}
          />
        )}
      </section>
    </ConPermiso>
  )
}
