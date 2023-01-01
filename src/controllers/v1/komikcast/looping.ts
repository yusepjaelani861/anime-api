import axiosService from "../../../libraries/axiosServices";
import Axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const url = 'https://komikcast.site';

const listKomik = async () => {
    const response: any = await axiosService(`${url}/daftar-komik/?list`);

    const $ = cheerio.load(response);

    const list = $('div[class="list-update"]').find('li').map((i, el) => {
        return {
            title: $(el).find('a').attr('class', 'series').text(),
            url: $(el).find('a').attr('class', 'series').attr('href')?.replace(url, '').replace('/komik/', '').replace('/', ''),
        }
    }).get()

    return list;
}

const komikGet = async (slug: string) => {
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
                url: $(el).attr('href')?.replace(url, '').replace('/genres/', '').replace('/', '')
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
            chapter: $(el).find('a').attr('class', 'chapter-link-item').text(),
            url: $(el).find('a').attr('class', 'chapter-link-item').attr('href')?.replace(url, '').replace('/chapter/', '').replace('/', '')
        }
    }).get()
    chapter.reverse()

    let komik: any;

    komik = await prisma.komik.findFirst({
        where: {
            slug: slug
        }
    })

    if (!komik) {
        komik = await prisma.komik.create({
            data: {
                slug: slug,
                title: title,
                original: original,
                released_on: released,
                author: author,
                total_chapter: total_chapter,
                description: description,
                image: thumbnail,
                rating: rating,
                status: status,
            }
        })
    }

    await Promise.all(genre.map(async (item: any) => {
        let genre: any;

        console.log(item.url)

        genre = await prisma.genreKomik.findFirst({
            where: {
                slug: item.url
            }
        })

        if (!genre) {
            genre = await prisma.genreKomik.create({
                data: {
                    slug: item.url,
                    name: item.name
                }
            })
        }

        let komik_genre: any;

        komik_genre = await prisma.komikGenre.findFirst({
            where: {
                komik_id: komik.id,
                genre_id: genre.id
            }
        })

        if (!komik_genre) {
            await prisma.komikGenre.create({
                data: {
                    komik_id: komik.id,
                    genre_id: genre.id
                }
            })
        }
    }))

    await Promise.all(type.map(async (item: any) => {
        let type: any;

        type = await prisma.typeKomik.findFirst({
            where: {
                slug: item.url
            }
        })

        if (!type) {
            type = await prisma.typeKomik.create({
                data: {
                    slug: item.url,
                    name: item.name
                }
            })
        }

        await prisma.komikType.create({
            data: {
                komik_id: komik.id,
                type_id: type.id
            }
        })
    }))

    await Promise.all(chapter.map(async (item: any) => {
        let chapter: any;

        chapter = await prisma.komikChapter.findFirst({
            where: {
                slug: item.url
            }
        })

        if (!chapter) {
            chapter = await prisma.komikChapter.create({
                data: {
                    slug: item.url,
                    komik_id: komik.id,
                    title: item.chapter,
                }
            })
        }
        console.log('Chapter berhasil ditambahkan untuk ' + komik.title)
        await chapterGet(item.url, chapter.id)

    }))
}

const chapterGet = async (slug: string, id: number) => {
    const chapter: any = await prisma.komikChapter.findFirst({
        where: {
            id: id
        }
    })

    if (!chapter) {
        return;
    }

    const response: any = await axiosService(`${url}/chapter/${slug}`);

    const $ = cheerio.load(response);

    const images = $('div[class="chapter_body"]').find('div').attr('class', 'main-reading-area').find('img').map((i, el) => {
        return {
            index: i,
            url: $(el).attr('src')
        }
    }).get()

    await Promise.all(images.map(async (item: any) => {
        let image: any;

        image = await prisma.komikGambar.findFirst({
            where: {
                komik_chapter_id: id,
                index: item.index
            }
        })

        if (!image) {
            const gambar = await Axios({
                method: 'get',
                url: item.url,
                responseType: "stream",
            })

            let url: string;
            if (!fs.existsSync(path.join(__dirname, '../../../../public/komik/' + chapter.title.replace(/\s/g, '-') + '/'))) {
                fs.mkdirSync(path.join(__dirname, '../../../../public/komik/' + chapter.title.replace(/\s/g, '-') + '/'));
            }

            const writer = fs.createWriteStream(path.join(__dirname, '../../../../public/komik/' + chapter.title.replace(/\s/g, '-') + '/' + item.url.split('/').pop()));

            gambar.data.pipe(writer);
            url = `/public/komik/${chapter.title.replace(/\s/g, '-')}/${item.url.split('/').pop()}`

            image = await prisma.komikGambar.create({
                data: {
                    komik_chapter_id: id,
                    index: item.index,
                    image: url
                }
            })
        }
    }))
}

async function loop() {
    try {
        // const list = await listKomik();
        const list = await prisma.komik.findMany({
            take: 100
        });

        await Promise.all(
            list.map(async (komik: any, index: number) => {
                console.log("process scrape data ", komik.title);
                await komikGet(komik.slug);
            })
        )
    } catch (error: any) {
        console.log(error);
        fs.writeFileSync('error.log', error);
    }
}

loop();