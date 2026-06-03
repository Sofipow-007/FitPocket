const { generarPlanDemo, guardarPlan, getPlanActual } = require('../controller/planController')
const auth = require('../middleware/auth')

router.post('/generar', generarPlanDemo)

router.post('/guardar', guardarPlan)

router.get('/actual', auth, getPlanActual)