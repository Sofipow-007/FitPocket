const { guardarPlan, getPlanActual } = require('../controller/planController')
const auth = require('../middleware/auth')

router.post('/guardar', guardarPlan)

router.get('/actual', auth, getPlanActual)