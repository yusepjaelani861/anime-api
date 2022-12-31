import express from "express";
import { home, animelist, animeView, genres, genre, seasons, season } from "../../../controllers/v1/kusonime/data";

const router = express.Router();

router.route("/").get(home);

router.route("/anime-list").get(animelist);

router.route("/genres").get(genres);

router.route('/genres/:slug').get(genre);

router.route("/seasons").get(seasons);

router.route("/seasons/:slug").get(season);

router.route("/:slug").get(animeView);

export default router;
