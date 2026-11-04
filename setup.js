// Prepara el proyecto después de clonarlo. Uso, desde la carpeta del repo:
//
//   node setup.js                 → chequea Node, arma los .env e instala backend y frontend
//   node setup.js --sin-instalar  → solo los .env
//
// Instala con "npm ci": respeta package-lock.json al pie de la letra y nunca lo modifica.
// Para agregar o actualizar una dependencia sí se usa "npm install <paquete>".

// Primero la versión de Node: con una vieja, lo de abajo falla con errores confusos
require('./fullStack/backend/scripts/verificarNode.cjs');

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = __dirname;
const BACKEND = path.join(RAIZ, 'fullStack', 'backend');
const FRONTEND = path.join(RAIZ, 'fullStack', 'frontend');

const titulo = (t) => console.log(`\n── ${t} ──`);

function copiarEjemplo(dir, nombre) {
    const destino = path.join(dir, '.env');
    if (fs.existsSync(destino)) {
        console.log(`${nombre}: ya existe .env, no se tocó.`);
        return 'existia';
    }
    fs.copyFileSync(path.join(dir, '.env.example'), destino);
    console.log(`${nombre}: se creó .env a partir de .env.example.`);
    return 'ejemplo';
}

async function envBackend() {
    titulo('.env del backend');
    if (fs.existsSync(path.join(BACKEND, '.env'))) {
        console.log('Ya existe fullStack/backend/.env, no se tocó.');
        return true;
    }
    if (fs.existsSync(path.join(BACKEND, '.env.cifrado'))) {
        try {
            return await require('./fullStack/backend/scripts/envCifrado').abrir();
        } catch (error) {
            console.error(error.message);
            console.error('Cuando tengas la contraseña: cd fullStack/backend && npm run env:abrir');
            return false;
        }
    }
    copiarEjemplo(BACKEND, 'Backend');
    console.log('No hay .env.cifrado en el repo: completá fullStack/backend/.env con los valores reales.');
    return false;
}

function instalar(dir, nombre) {
    titulo(`Instalando ${nombre} (npm ci)`);
    // en Windows npm es un .cmd y desde Node 20 no se puede lanzar sin shell
    const r = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
    if (r.status !== 0) {
        console.error(`Falló la instalación de ${nombre}. Revisá el error de arriba y corré "npm ci" en ${path.relative(RAIZ, dir)}.`);
        return false;
    }
    return true;
}

async function main() {
    console.log(`FitPocket · preparando el proyecto con Node ${process.versions.node}`);
    const envOk = await envBackend();
    titulo('.env del frontend');
    copiarEjemplo(FRONTEND, 'Frontend');

    let instalado = true;
    if (!process.argv.includes('--sin-instalar')) {
        instalado = instalar(BACKEND, 'el backend') && instalar(FRONTEND, 'el frontend');
    }

    titulo('Resultado');
    if (envOk && instalado) {
        console.log('Todo listo. Para levantar la app, en dos terminales:');
    } else {
        console.log('Quedaron pasos pendientes (ver arriba). Cuando estén, para levantar la app:');
    }
    console.log('  cd fullStack/backend  && npm run dev     → http://localhost:3000');
    console.log('  cd fullStack/frontend && npm run dev     → http://localhost:5173');
    if (!(envOk && instalado)) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(1); });
