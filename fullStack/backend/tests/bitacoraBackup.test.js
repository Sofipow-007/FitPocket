const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/User');
const Bitacora = require('../models/Bitacora');
const { asegurarPermisosBase } = require('../services/permisosService');
const { restaurarBackup, listarBackups } = require('../services/backupService');

const esperar = (ms) => new Promise(r => setTimeout(r, ms));

let dirBackups;
beforeAll(async () => {
    dirBackups = fs.mkdtempSync(path.join(os.tmpdir(), 'fitpocket-backups-'));
    process.env.BACKUP_DIR = dirBackups;
    await db.conectar();
});
afterEach(db.limpiar);
afterAll(async () => {
    await db.desconectar();
    fs.rmSync(dirBackups, { recursive: true, force: true });
    delete process.env.BACKUP_DIR;
});

async function registrar(email) {
    const res = await request(app).post('/auth/register').send({ nombre: 'Test', email, password: 'clave1234' });
    return res.body.token;
}

async function admin(email = 'admin@test.com') {
    const token = await registrar(email);
    const { Administrador } = await asegurarPermisosBase();
    await User.updateOne({ email }, { familias: [Administrador._id], rol: 'admin' });
    return { Authorization: `Bearer ${token}` };
}

describe('GET /bitacora', () => {
    test('pagina del más nuevo al más viejo y filtra por estado y email', async () => {
        const auth = await admin();
        await registrar('otro@test.com');
        await request(app).post('/auth/login').send({ email: 'otro@test.com', password: 'mal' }); // 400
        await esperar(100);

        let res = await request(app).get('/bitacora?porPagina=2').set(auth);
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.total).toBeGreaterThanOrEqual(3);
        const fechas = res.body.items.map(i => new Date(i.fecha).getTime());
        expect(fechas[0]).toBeGreaterThanOrEqual(fechas[1]);

        res = await request(app).get('/bitacora?estado=4xx').set(auth);
        expect(res.body.items.length).toBeGreaterThan(0);
        expect(res.body.items.every(i => i.statusCode >= 400 && i.statusCode < 500)).toBe(true);

        res = await request(app).get('/bitacora?email=admin@').set(auth);
        expect(res.body.items.every(i => i.email === 'admin@test.com')).toBe(true);

        res = await request(app).get('/bitacora?email=nadie@x.com').set(auth);
        expect(res.body.total).toBe(0);
    });

    test('lista las acciones para el filtro', async () => {
        const auth = await admin();
        await esperar(50);
        const res = await request(app).get('/bitacora/acciones').set(auth);
        expect(res.body.acciones).toContain('Registro de usuario');
    });

    test('un usuario sin bitacora.ver recibe 403', async () => {
        const token = await registrar('comun@test.com');
        const res = await request(app).get('/bitacora').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    test('no guarda contraseñas ni emails en texto plano', async () => {
        await registrar('secreto@test.com');
        await request(app).post('/auth/login').send({ email: 'secreto@test.com', password: 'clave1234' });
        await request(app).post('/auth/login').send({ email: 'secreto@test.com', password: 'otraClave99' });
        await esperar(100);
        const todo = JSON.stringify(await Bitacora.find().lean());
        expect(todo).not.toMatch(/secreto@test\.com/);
        expect(todo).not.toMatch(/clave1234|otraClave99/);
    });
});

describe('Backup y restore', () => {
    test('backup → borrar un usuario → restore: vuelve y la integridad da OK', async () => {
        const auth = await admin();
        await registrar('victima@test.com');
        await esperar(100);

        const res = await request(app).post('/backup').set(auth);
        expect(res.status).toBe(201);
        const nombre = res.body.backup.nombre;
        expect(fs.existsSync(path.join(dirBackups, nombre, 'users.json'))).toBe(true);

        const victima = await User.findOne({ email: 'victima@test.com' });
        expect((await request(app).delete(`/users/${victima._id}`).set(auth)).status).toBe(200);
        expect(await User.exists({ email: 'victima@test.com' })).toBeNull();

        const resultado = await restaurarBackup(nombre);
        expect(resultado.restauradas.find(c => c.nombre === 'users').documentos).toBe(2);

        const restaurada = await User.findOne({ email: 'victima@test.com' }).lean();
        expect(String(restaurada._id)).toBe(String(victima._id)); // el ObjectId se conserva (EJSON)
        expect(restaurada.createdAt).toBeInstanceOf(Date);

        const integridad = await request(app).get('/integridad/verificar').set(auth);
        expect(integridad.body.ok).toBe(true);
    });

    test('conserva solo los últimos BACKUP_RETENCION', async () => {
        const auth = await admin();
        process.env.BACKUP_RETENCION = '2';
        try {
            for (let i = 0; i < 3; i++) await request(app).post('/backup').set(auth);
            const backups = await listarBackups();
            expect(backups.length).toBe(2);
        } finally {
            delete process.env.BACKUP_RETENCION;
        }
    }, 20000);

    test('un nombre con ../ no se acepta', async () => {
        await expect(restaurarBackup('../../etc')).rejects.toThrow('Nombre de backup inválido');
    });

    test('un usuario sin backup.ejecutar recibe 403', async () => {
        const token = await registrar('comun2@test.com');
        expect((await request(app).post('/backup').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    });
});
