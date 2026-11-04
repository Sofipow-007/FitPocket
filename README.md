# FitPocket
Coach Personal Fitness

## Documentación

La documentación del proyecto (descripción, requisitos, diseño, base de datos y backend) está en la carpeta [`documentacion/`](documentacion/README.md).

## Stack

- **Frontend**: React 19 + Vite, React Router, Tailwind, i18next (es/en). `fullStack/frontend/`
- **Backend**: Node + Express 5, MongoDB Atlas vía Mongoose, JWT + bcrypt. `fullStack/backend/`
- **IA**: Groq (`openai/gpt-oss-120b`, configurado en `backend/services/iaService.js`)

## Requisitos

- Node.js 22 LTS (mínimo 20.19). Si tenés uno más viejo, `npm install` se frena y te lo avisa. Con [nvm](https://github.com/nvm-sh/nvm) alcanza con `nvm use`: la versión está en `.nvmrc`.
- Una base MongoDB (Atlas o local) — ver `fullStack/backend/.env.example`
- Una API key de [Groq](https://console.groq.com/keys) para la generación de planes

## Después de clonar: un solo comando

```bash
node setup.js
```

Chequea la versión de Node, crea los `.env` e instala backend y frontend. Pide la **contraseña del equipo**: con ella descifra `fullStack/backend/.env.cifrado`, que es el `.env` real guardado en el repo de forma cifrada (el repositorio es público, así que el `.env` en texto plano no se sube nunca). Si ya existe un `.env`, no lo toca.

Instala con `npm ci`, que usa exactamente las versiones de `package-lock.json` y no lo modifica. Para agregar o actualizar una dependencia, `npm install <paquete>` y se sube el `package-lock.json` que cambia.

Si cambiás algo del `.env` del backend (una clave nueva, otra base), volvé a cifrarlo para el resto del equipo y subí el archivo:

```bash
cd fullStack/backend
npm run env:cerrar      # pide la contraseña del equipo dos veces
git add .env.cifrado && git commit -m "chore: actualizar .env cifrado" && git push
```

`npm run env:abrir` hace lo inverso (crea el `.env` desde `.env.cifrado`), por si no se usa `setup.js`.

## Backend

```bash
cd fullStack/backend
npm ci
npm run dev             # http://localhost:3000
```

`npm install` no descarga MongoDB. Las pruebas (`npm test`) usan una base en memoria que baja MongoDB (~800 MB) la primera vez que se corren; las siguientes ya lo tienen guardado.

Variables de entorno (`fullStack/backend/.env`):

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Connection string de MongoDB (Atlas o local) |
| `JWT_SECRET` | Clave para firmar los tokens de sesión |
| `CRYPTO_KEY` | Clave para encriptar datos sensibles del perfil (nombre, limitaciones, aclaración). Obligatoria: sin ella el backend no arranca. Si se pierde, los datos cifrados no se pueden recuperar. |
| `GROQ_API_KEY` | API key de Groq para generar rutina y dieta |
| `PORT` | Puerto del servidor (default 3000) |
| `FRONTEND_URL` | URL del frontend, para armar el enlace de recuperación de contraseña (default `http://localhost:5173`) |
| `ADMIN_EMAILS` | Opcional. Emails de las cuentas administradoras, separados por coma. Al arrancar el backend, las que ya existen pasan a admin; las que no, quedan como admin al registrarse. Sacarlas de la lista no les quita el rol (se hace desde `/admin` → Familias) |
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
npm ci
cp .env.example .env   # opcional, default apunta a localhost:3000
npm run dev             # http://localhost:5173
```

`VITE_API_URL` en `fullStack/frontend/.env` apunta al backend (default `http://localhost:3000`).
