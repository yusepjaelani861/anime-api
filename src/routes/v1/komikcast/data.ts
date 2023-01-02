import express from 'express'

import {
    detailKomik,
    homePage,
    listKomik,
    viewChapter,
} from '../../../controllers/v1/komikcast/data'
import cache from '../../../middleware/cache'

const router = express.Router()

router
    .route('/')
    .get(homePage)

router
    .route('/komik')
    .get(cache(10), listKomik)

router
    .route('/komik/:slug')
    .get(detailKomik)

router
    .route('/chapter/:slug')
    .get(viewChapter)

export default router