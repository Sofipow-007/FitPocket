# FitPocket
Coach Personal Fitness

## Stack

- **Frontend**: React 19 + Vite, React Router, Tailwind, i18next (es/en). `fullStack/frontend/`
- **Backend**: Node + Express 5, MongoDB Atlas vía Mongoose, JWT + bcrypt. `fullStack/backend/`
- **IA**: Groq (`openai/gpt-oss-120b`, configurado en `backend/services/iaService.js`)

## Requisitos

- Node.js 20+
- Una base MongoDB (Atlas o local) — ver `fullStack/backend/.env.example`
- Una API key de [Groq](https://console.groq.com/keys) para la generación de planes

## Backend

```bash
cd fullStack/backend
npm install
cp .env.example .env   # completar con tus valores
npm run dev             # http://localhost:3000
```

Variables de entorno (`fullStack/backend/.env`):

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Connection string de MongoDB (Atlas o local) |
| `JWT_SECRET` | Clave para firmar los tokens de sesión |
| `CRYPTO_KEY` | Clave para encriptar datos sensibles del perfil (nombre, limitaciones, aclaración). **Sin esta variable, el backend usa una clave por defecto — no usar así en producción.** |
| `GROQ_API_KEY` | API key de Groq para generar rutina y dieta |
| `PORT` | Puerto del servidor (default 3000) |
| `FRONTEND_URL` | URL del frontend, para armar el enlace de recuperación de contraseña (default `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Servidor de correo para enviar ese enlace. Sirve cualquier SMTP (Gmail con contraseña de aplicación, Brevo, etc.). **Si faltan, no se envía ningún mail y el enlace se imprime en la consola del backend.** |
| `MAIL_FROM` | Remitente de los mails (default: `SMTP_USER`) |

Si tu IP no está en la whitelist de MongoDB Atlas (Network Access), el servidor arranca pero no puede conectar a la base — vas a ver `Could not connect to any servers` o `ENOTFOUND` en la consola.

### Alternativa local a Groq: Ollama

Si no tenés `GROQ_API_KEY`, podés correr un modelo local con [Ollama](https://ollama.com/download) (instalación manual, no hay script automático porque `winget` no está disponible en todos los Windows):

```bash
ollama pull llama3
```

Y adaptar `backend/services/iaService.js` para apuntar a tu instancia local en vez de Groq.

## Frontend

```bash
cd fullStack/frontend
npm install
cp .env.example .env   # opcional, default apunta a localhost:3000
npm run dev             # http://localhost:5173
```

`VITE_API_URL` en `fullStack/frontend/.env` apunta al backend (default `http://localhost:3000`).
