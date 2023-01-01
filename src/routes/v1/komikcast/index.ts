import express from 'express'

import grab from './grab'

const router = express.Router()

router.use('/grab', grab)

export default router