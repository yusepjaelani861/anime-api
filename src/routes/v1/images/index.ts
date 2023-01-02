import express from 'express'
import convert from './convert'

const router = express.Router()

router.use('/', convert)

export default router