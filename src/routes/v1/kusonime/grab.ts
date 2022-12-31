import express from 'express';
import {
    page,
    animelist,
    genres,
} from '../../../controllers/v1/kusonime/grab';

const router = express.Router();

router
    .route('/anime-list')
    .get(animelist);

router
    .route('/genres')
    .get(genres);

router
    .route('/:slug')
    .get(page);


export default router;