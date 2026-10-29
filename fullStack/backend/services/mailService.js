const nodemailer = require('nodemailer')

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')

// Sin SMTP configurado no se envía nada: el contenido sale por consola,
// que alcanza para desarrollo y para mostrar el flujo en una demo.
const smtpConfigurado = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

// Patrón Singleton: un solo transporter SMTP por proceso, creado al primer envío
// (nodemailer reusa la conexión; crear uno por mail abriría una conexión nueva cada vez).
let transporter = null
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  }
  return transporter
}

// Textos de cada tipo de mail, por idioma
const TEXTOS = {
  recuperacion: {
    es: {
      asunto: 'Restablecé tu contraseña de FitPocket',
      saludo: 'Hola,',
      cuerpo: 'Recibimos un pedido para restablecer la contraseña de tu cuenta de FitPocket. Abrí este enlace para elegir una nueva:',
      boton: 'Elegir contraseña nueva',
      vence: (min) => `El enlace vence en ${min} minutos y se puede usar una sola vez.`,
      ignorar: 'Si no fuiste vos, ignorá este mail: tu contraseña no cambia.'
    },
    en: {
      asunto: 'Reset your FitPocket password',
      saludo: 'Hi,',
      cuerpo: 'We received a request to reset the password for your FitPocket account. Open this link to choose a new one:',
      boton: 'Choose a new password',
      vence: (min) => `The link expires in ${min} minutes and can only be used once.`,
      ignorar: "If this wasn't you, ignore this email: your password stays the same."
    }
  },
  alertaAdherencia: {
    es: {
      asunto: 'Tu semana en FitPocket viene floja',
      saludo: 'Hola,',
      cuerpo: (pct) => `Esta semana cumpliste el ${pct}% de tu plan. Un día flojo no arruina nada: hoy podés volver a sumar.`,
      boton: 'Ver mi plan de hoy',
      pie: 'Te escribimos como mucho una vez por día.'
    },
    en: {
      asunto: 'Your FitPocket week is slipping',
      saludo: 'Hi,',
      cuerpo: (pct) => `This week you completed ${pct}% of your plan. One off day doesn't ruin anything: you can get back on track today.`,
      boton: "See today's plan",
      pie: 'We email you at most once a day.'
    }
  }
}

// Una función por tipo: arma asunto, texto plano y HTML a partir de los textos
const CONSTRUCTORES = {
  recuperacion: (t, { token, minutos }) => {
    const enlace = `${FRONTEND_URL}/restablecer?token=${token}`
    return {
      enlace,
      asunto: t.asunto,
      texto: `${t.saludo}\n\n${t.cuerpo}\n${enlace}\n\n${t.vence(minutos)}\n${t.ignorar}`,
      html: `<p>${t.saludo}</p><p>${t.cuerpo}</p><p><a href="${enlace}">${t.boton}</a></p><p>${t.vence(minutos)}<br>${t.ignorar}</p>`
    }
  },
  alertaAdherencia: (t, { porcentaje }) => {
    const enlace = `${FRONTEND_URL}/dashboard`
    const pct = Math.round(Number(porcentaje) || 0)
    return {
      enlace,
      asunto: t.asunto,
      texto: `${t.saludo}\n\n${t.cuerpo(pct)}\n${enlace}\n\n${t.pie}`,
      html: `<p>${t.saludo}</p><p>${t.cuerpo(pct)}</p><p><a href="${enlace}">${t.boton}</a></p><p>${t.pie}</p>`
    }
  }
}

// Patrón Factory Method: crea el mail del tipo pedido en el idioma del usuario.
// Para sumar un mail nuevo alcanza con sus textos y su constructor.
function crearMail(tipo, idioma, datos = {}) {
  const textos = TEXTOS[tipo]
  if (!textos) throw new Error(`No existe el tipo de mail "${tipo}"`)
  return CONSTRUCTORES[tipo](textos[idioma === 'en' ? 'en' : 'es'], datos)
}

async function enviar(email, mail) {
  if (!smtpConfigurado()) {
    console.log(`[mail] SMTP sin configurar. "${mail.asunto}" para ${email}:\n${mail.enlace}`)
    return { enviado: false, enlace: mail.enlace }
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: mail.asunto,
    text: mail.texto,
    html: mail.html
  })
  return { enviado: true, enlace: mail.enlace }
}

const enviarMailDeReset = ({ email, token, idioma, minutos }) =>
  enviar(email, crearMail('recuperacion', idioma, { token, minutos }))

const enviarAlertaAdherencia = ({ email, idioma, porcentaje }) =>
  enviar(email, crearMail('alertaAdherencia', idioma, { porcentaje }))

module.exports = { crearMail, enviarMailDeReset, enviarAlertaAdherencia, smtpConfigurado }
