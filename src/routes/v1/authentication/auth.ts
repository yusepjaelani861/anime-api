import express from 'express'
import { protect } from '../../../middleware/auth'
import {
    login,
    logout,
    register,
    validation
} from '../../../controllers/v1/authentications/auth'

const router = express.Router()

router
    .route('/register')
    .post(validation('register'), register)

router
    .route('/login')
    .post(validation('login'), login)

router
    .route('/logout')
    .get(protect, logout)


export default router