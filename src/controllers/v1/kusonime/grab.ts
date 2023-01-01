import cheerio from 'cheerio';
import axiosService from '../../../libraries/axiosServices';
import asyncHandler from '../../../middleware/async';
import { NextFunction, Request, Response } from 'express';
import { sendResponse, sendError } from '../../../libraries/rest';
import fs from 'fs';
import Axios from 'axios';

const url = 'https://kusonime.com';

const page = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    const response: any = await axiosService(`${url}/${slug}`);

    const $ = cheerio.load(response);

    const title = $('h1[class="jdlz"]').text();
    let image: any = $('div[class="post-thumb"]').find('img').attr('src');

    const detail = $('div[class="lexot"]');
    const description = detail.find('p').eq(10).text();
    const credit = detail.find('p').eq(11).text();
    const keywords = detail.find('p').eq(13).text();
    
    const info = $('div[class="info"]');
    const japanese = info.find('p').eq(0).text();
    const genres = info.find('p').eq(1).find('a').map((i, el) => {
        return {
            name: $(el).text(),
            url: $(el).attr('href')?.replace(url, '').replace('/genres/', '').replace('/', '')
        }
    }).get();
    const seasons = info.find('p').eq(2).find('a').map((i, el) => {
        return {
          name: $(el).text(),
          url: $(el).attr("href")?.replace(url, "").replace("/seasons/", "").replace('/', ''),
        };
    }).get();
    const producers = info.find('p').eq(3).text().replace('Producers: ', '');
    const type = info.find('p').eq(4).text().replace('Type: ', '');
    const status = info.find('p').eq(5).text().replace('Status: ', '');
    const total_episode = info.find('p').eq(6).text().replace('Total Episode: ', '');
    const score = info.find('p').eq(7).text().replace('Score: ', '');
    const duration = info.find('p').eq(8).text().replace('Duration: ', '');
    const released_on = info.find('p').eq(9).text().replace('Released on: ', '');

    const dlbox = $('div[class="dlbod"]');
    const smokeurl = dlbox.find('div[class="smokeurl"]');
    const download_url = smokeurl.map((i, el) => {
        return {
            name: $(el).find('strong').text(),
            children: $(el).find('a').map((i, el) => {
                return {
                    name: $(el).text(),
                    url: $(el).attr('href')
                }
            }).get()
        }
    }).get();

    const gambar = await Axios({
        method: 'get',
        url: image,
        responseType: 'stream'
    })

    const gambar_name = image.split('/').pop();

    // if file exists, then delete it
    if (!fs.existsSync(`public/images/${gambar_name}.jpg`)) {
        gambar.data.pipe(fs.createWriteStream(`public/images/${gambar_name}.jpg`));
    }

    image = req.protocol + '://' + req.get('host') + '/public/images/' + gambar_name + '.jpg';


    res.json(new sendResponse({
        title,
        japanese,
        genres,
        seasons,
        producers,
        type,
        status,
        total_episode,
        score,
        duration,
        released_on,
        image,
        description,
        credit,
        keywords,
        download_url,
    }, 'Success getting data'));
})

const animelist = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page || 1;
    const response: any = await axiosService(`${url}/list-anime-batch-sub-indo/page/${page}`);

    const $ = cheerio.load(response);

    const list = $('div[id="abtext"]').find('div[class="penzbar"]');
    const anime = list.map((i, el) => {
        let title = $(el).find('div[class="jdlbar"]').find('a[class="kmz"]').text();
        if (title !== "") {
            return {
                title: title,
                url: $(el).find('div[class="jdlbar"]').find('a[class="kmz"]').attr('href')?.replace(url, '').replace('/', '').replace('/', ''),
            };
        }
    }).get();

    const total_anime = anime.length;

    const pagination = $('div[class="navigation"]');
    const next_page = pagination.find('a[class="nextpostslink"]').attr('href')?.replace(url, '');
    let has_next_page = false;
    if (next_page !== undefined) {
        has_next_page = true;
    }

    res.json(new sendResponse({
        has_next_page,
        total_anime,
        anime
    }, 'Success getting data'));
})

const genres = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const response: any = await axiosService(`${url}/genres`);

    const $ = cheerio.load(response);

    const list = $('ul[class="genres"]');
    const genres = list.find('a').map((i, el) => {
        let name = $(el).text();
        if (name !== undefined || name !== "") {
            return {
                name,
                url: $(el).attr('href')?.replace(url, '').replace('/genres/', '').replace('/', '')
            };
        }
    }).get();

    res.json(new sendResponse({
        genres
    }, 'Success getting data'));
})

export {
    page,
    animelist,
    genres,
}