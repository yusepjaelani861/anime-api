import axiosService from "../../../libraries/axiosServices";
import Axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function loop(page: number = 1) {
  try {
    console.log('Process')
    const url = "https://kusonime.com";
    const response: any = await axiosService(
      `${url}/list-anime-batch-sub-indo/page/${page}`
    );

    const $ = cheerio.load(response);

    const list = $('div[id="abtext"]').find('div[class="penzbar"]');
    const anime = list
      .map((i, el) => {
        let title = $(el)
          .find('div[class="jdlbar"]')
          .find('a[class="kmz"]')
          .text();
        if (title !== "") {
          return {
            title: title,
            url: $(el)
              .find('div[class="jdlbar"]')
              .find('a[class="kmz"]')
              .attr("href")
              ?.replace(url, "")
              .replace("/", "")
              .replace("/", ""),
          };
        }
      })
      .get();

    const total_anime = anime.length;

    const pagination = $('div[class="navigation"]');
    const next_page = pagination
      .find('a[class="nextpostslink"]')
      .attr("href")
      ?.replace(url, "");
    let has_next_page = false;
    if (next_page !== undefined) {
      has_next_page = true;
    }

    await Promise.all(
      anime.map(async (el: any, index: number) => {
        console.log("process scrape data ", el.title);
        const cek = await prisma.anime.findFirst({
          where: {
            slug: el.url,
          },
        });

        if (!cek) {
          const response: any = await axiosService(`${url}/${el.url}`);

          const $ = cheerio.load(response);

          const title = $('h1[class="jdlz"]').text();
          let image: any = $('div[class="post-thumb"]').find("img").attr("src");

          const detail = $('div[class="lexot"]');
          const description = detail.find("p").eq(10).text();
          const credit = detail.find("p").eq(11).text();
          const keywords = detail.find("p").eq(13).text();

          const info = $('div[class="info"]');
          const japanese = info.find("p").eq(0).text();
          const genres = info
            .find("p")
            .eq(1)
            .find("a")
            .map((i, el) => {
              return {
                name: $(el).text(),
                url: $(el)
                  .attr("href")
                  ?.replace(url, "")
                  .replace("/genres/", "")
                  .replace("/", ""),
              };
            })
            .get();
          const seasons = info
            .find("p")
            .eq(2)
            .find("a")
            .map((i, el) => {
              return {
                name: $(el).text(),
                url: $(el)
                  .attr("href")
                  ?.replace(url, "")
                  .replace("/seasons/", "")
                  .replace("/", ""),
              };
            })
            .get();
          const producers = info
            .find("p")
            .eq(3)
            .text()
            .replace("Producers: ", "");
          const type = info.find("p").eq(4).text().replace("Type: ", "");
          const status = info.find("p").eq(5).text().replace("Status: ", "");
          const total_episode = info
            .find("p")
            .eq(6)
            .text()
            .replace("Total Episode: ", "");
          const score = info.find("p").eq(7).text().replace("Score: ", "");
          const duration = info
            .find("p")
            .eq(8)
            .text()
            .replace("Duration: ", "");
          const released_on = info
            .find("p")
            .eq(9)
            .text()
            .replace("Released on: ", "");

          const dlbox = $('div[class="dlbod"]');
          const smokeurl = dlbox.find('div[class="smokeurl"]');
          const download_url = smokeurl
            .map((i, el) => {
              return {
                name: $(el).find("strong").text(),
                children: $(el)
                  .find("a")
                  .map((i, el) => {
                    return {
                      name: $(el).text(),
                      url: $(el).attr("href"),
                    };
                  })
                  .get(),
              };
            })
            .get();

          const gambar = await Axios({
            method: "get",
            url: image,
            responseType: "stream",
          });

          const gambar_name = image.split("/").pop();

          // if file exists, then delete it
          if (!fs.existsSync(`../../../../public/images/${gambar_name}`)) {
            gambar.data.pipe(
              fs.createWriteStream(
                `../../../../public/images/${gambar_name}`
              )
            );
          }

          image = "/public/images/" + gambar_name;

          const newAnime = await prisma.anime.create({
            data: {
              title: title,
              slug: el.url,
              image: image,
              description: description,
              japanese: japanese,
              producers: producers,
              type: type,
              status: status,
              total_episode: total_episode,
              score: score,
              duration: duration,
              released_on: released_on,
              keywords: keywords,
            },
          });

          await Promise.all(genres.map(async (el: any) => {
            let genre = await prisma.genre.findFirst({
              where: {
                slug: el.url,
              },
            });

            if (!genre) {
              genre = await prisma.genre.create({
                data: {
                  name: el.name,
                  slug: el.url,
                },
              });
            }

            await prisma.animeGenre.create({
              data: {
                anime_id: newAnime.id,
                genre_id: genre?.id,
              },
            });
          }))

          await Promise.all(seasons.map(async (el: any) => {
            let season = await prisma.season.findFirst({
              where: {
                slug: el.url,
              },
            });

            if (!season) {
              season = await prisma.season.create({
                data: {
                  name: el.name,
                  slug: el.url,
                },
              });
            }

            await prisma.animeSeason.create({
              data: {
                anime_id: newAnime.id,
                season_id: season.id,
              },
            });
          }))

          await Promise.all(download_url.map(async (el: any) => {
            await Promise.all(el.children.map(async (download: any) => {
                await prisma.animeDownload.create({
                  data: {
                    anime_id: newAnime.id,
                    quality: el.name,
                    url: download.url,
                    name: download.name,
                  },
                });
            }))
          }))
        }

        console.log("Selesai grab data " + el.title);

        if (index === total_anime - 1) {
          if (has_next_page === true) {
            await loop(page + 1);
          }
        }
      })
    );
  } catch (error: any) {
    fs.appendFile(
      "error.log",
      `error page ${page} : ${error.message} \n`,
      function (err) {
        if (err) throw err;
        console.log("Saved!");
      }
    );
  }
}

loop();