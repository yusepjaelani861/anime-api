import express from 'express'

import {
    komik,
    listKomik,
    chapter,
} from '../../../controllers/v1/komikcast/grab'
import cache from '../../../middleware/cache'

const router = express.Router()

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