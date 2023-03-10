import express from 'express'

import {
    komik,
    listKomik,
    chapter,
    home,
} from '../../../controllers/v1/komikcast/grab'
import cache from '../../../middleware/cache'

const router = express.Router()

router
    .route('/')
    .get(cache(60) ,home)

router
    .route('/komik')
    .get(cache(10), listKomik)

router
    .route('/komik/:slug')
    .get(komik)

router
    .route('/chapter/:slug')
    .get(chapter)


export default router