import express from 'express'
import {
    image
} from '../../../controllers/v1/images/convert'

const router = express.Router()

router
    .route('/')
    .get(image)

export default router