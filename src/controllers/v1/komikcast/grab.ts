import cheerio from 'cheerio';
import axiosService from '../../../libraries/axiosServices';
import asyncHandler from '../../../middleware/async';
import { NextFunction, Request, Response } from 'express';
import { sendResponse, sendError } from '../../../libraries/rest';
import fs from 'fs';
import Axios from 'axios';
import { eq } from 'cheerio/lib/api/traversing';
import pagination from '../../../libraries/pagination';

const url = 'https://komikcast.site';

const listKomik = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const response: any = await axiosService(`${url}/daftar-komik/?list`);

    const $ = cheerio.load(response);

    const list = $('div[class="list-update"]').find('li').map((i, el) => {
        return {
            title: $(el).find('a').attr('class', 'series').text(),
            url: $(el).find('a').attr('class', 'series').attr('href')?.replace(url, '').replace('/komik/', '').replace('/', ''),
        }
    }).get()

    res.json(new sendResponse({
        total_komik: list.length,
        komik: list,
    }, 'Success getting data'))
})

const komik = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    const response: any = await axiosService(`${url}/komik/${slug}`);

    const $ = cheerio.load(response);

    const thumbnail = $('div[class="komik_info-content-thumbnail"]').find('img').attr('src');

    const content = $('div[class="komik_info-content-body"]')
    const title = content.find('h1').attr('class', 'komik_info-content-body-title').text();
    const original = content.find('span').attr('class', 'komik_info-content-native').eq(0).text();
    const genre = content.find('span').attr('class', 'komik_info-content-genre').find('a').attr('class', 'genre-item comedy').attr('rel', 'tag').map((i, el) => {
        // if '/genres'
        if ($(el).attr('href')?.includes('/genres/')) {
            return {
                name: $(el).text(),
                slug: $(el).attr('href')?.replace(url, '').replace('/genres/', '').replace('/', '')
            }
        }
    }).get();

    const meta = content.find('div').attr('class', 'komik_info-content-meta')
    const released = meta.find('span').attr('class', 'komik_info-content-info-release').eq(0).text().replace('Released:\n', '')
    const author = meta.find('span').attr('class', 'komik_info-content-info').eq(1).text().replace('Author: ', '')
    const status = meta.find('span').attr('class', 'komik_info-content-info').eq(2).text().replace('Status: ', '')
    const type = meta.find('span').attr('class', 'komik_info-content-info-type').eq(3).find('a').map((i, el) => {
        return {
            name: $(el).text(),
            url: $(el).attr('href')?.replace(url, '').replace('/type/', '').replace('/', '')
        }
    }).get()
    const total_chapter = meta.find('span').attr('class', 'komik_info-content-info').eq(4).text().replace('Total Chapter: ', '')
    const updated_on = meta.find('span').attr('class', 'komik_info-content-update').eq(5).text().replace('Updated on: ', '')

    const rating = $('div[class="komik_info-content-rating"]').find('div').attr('class', 'data-rating').attr('data-ratingkomik')
    const description = $('div[class="komik_info-description"]').find('div').attr('class', 'komik_info-description-sinopsis').find('p').text()

    const chapter = $('div[class="komik_info-chapters"]').find('ul').attr('id', 'chapter-wrapper').attr('class', 'komik_info-chapters-wrapper').find('li').map((i, el) => {
        return {
            title: $(el).find('a').attr('class', 'chapter-link-item').text(),
            slug: $(el).find('a').attr('class', 'chapter-link-item').attr('href')?.replace(url, '').replace('/chapter/', '').replace('/', ''),
            created_at: new Date(),
        }
    }).get()
    chapter.reverse()

    res.json(new sendResponse({
        title,
        original,
        image: thumbnail,
        genres: genre,
        released,
        author,
        status,
        types: type,
        total_chapter,
        updated_on,
        rating,
        description,
        chapters: chapter
    }, 'Success getting data'))
})

const chapter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    const response: any = await axiosService(`${url}/chapter/${slug}`);

    const $ = cheerio.load(response);

    const images = $('div[class="chapter_body"]').find('div').attr('class', 'main-reading-area').find('img').map((i, el) => {
        return {
            index: i,
            image: $(el).attr('src')
        }
    }).get()
    // chapter.chapter = images

    const results = {
        chapter: {
            images: images
        }
    }

    res.json(new sendResponse(results, 'Success getting data'))
})

const home = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let { page = 1, limit = 28 } = req.query;

    page = parseInt(page as string) || 1;
    limit = parseInt(limit as string) || 28;

    // const halaman = parseInt(page as string) || 1;
    
    const response: any = await axiosService(`${url}/daftar-komik/page/${page}?sortby=update`);

    const $ = cheerio.load(response);

    const list = $('div[class="list-update_item"]').map((i, el) => {
        return {
            title: $(el).find('div').attr('class', 'list-update_item-info').find('h3').attr('class', 'title').text(),
            slug: $(el).find('a').attr('class', 'data-tooltip').attr('href')?.replace(url, '').replace('/komik/', '').replace('/', ''),
            thumbnail: $(el).find('div').attr('class', 'list-update_item-image').find('img').attr('class', 'ts-post-image wp-post-image attachment-medium size-medium').attr('src'),
            new_chapter: {
                chapter: $(el).find('div').attr('class', 'list-update_item-info').find('div').attr('class', 'other').find('div').attr('class', 'chapter').eq(0).text().replace('\n', '').replace(' ', ''),
                slug: $(el).find('div').attr('class', 'list-update_item-info').find('div').attr('class', 'other').find('div').attr('class', 'chapter').attr('href')?.replace(url, '').replace('/chapter/', '').replace('/', '')
            },
            rating: $(el).find('div').attr('class', 'list-update_item-info').find('div').attr('class', 'other').find('div').attr('class', 'rate').find('div').attr('class', 'rating').find('div').attr('class', 'numscore').text().replace('\n', '').replace(' ', '').replace('\n\n\n\n\n\n\n\n\n\n\n', ''),
        }
    }).get()

    res.json(new sendResponse({
        list
    }, 'Success getting data', pagination(page, limit, list.length * 100)))
})

export {
    komik,
    listKomik,
    chapter,
    home,
}