import express from 'express'

import grab from './grab'
import data from './data'

const router = express.Router()

router.use('/', data)
router.use('/grab', grab)

export default router