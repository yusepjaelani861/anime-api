import { PrismaClient } from "@prisma/client";
import asyncHandler from "../../../middleware/async";
import { NextFunction, Request, Response } from "express";
import pagination from "../../../libraries/pagination";
import { sendError, sendResponse } from "../../../libraries/rest";

const prisma = new PrismaClient();

const home = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    let { search, page = 1, limit = 10 } = req.query;
    let orderBy: Array<any> = [],
    where: any;
    page = parseInt(page as string);
    limit = parseInt(limit as string);

    if (Object.keys(req.query).length > 0) {
        Object.keys(req.query).forEach((filter, index) => {
            let key_and_op = filter.split(".");
            if (key_and_op.length > 1) {
            let key = key_and_op[0];
            let op = key_and_op[1];
            let value = req.query[filter];

            if (key === "sort") {
                orderBy.push({
                [op]: value,
                });
            }
            }
        });
    }
    
    const total_anime = await prisma.anime.count({
        where: where,
    });

    const anime = await prisma.anime.findMany({
        where: where,
        take: limit,
        skip: Math.floor(Math.random() * total_anime),
        orderBy: orderBy.length > 0 ? orderBy : [
            {
                id: "desc",
            }
        ],
        include: {
            genres: {
                include: {
                    genre: {
                        select: {
                            name: true,
                            slug: true,
                        }
                    },
                }
            }
        }
    });

    await Promise.all(anime.map(async (item: any) => {
        item.genres = item.genres.map((genre: any) => {
            return genre.genre
        })
    }))

    res.json(new sendResponse(anime, 'Success getting data', pagination(page, limit, total_anime)))
})

const animelist = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    let { search, page = 1, limit = 10 } = req.query;
    let orderBy: Array<any> = [], where: any;
    page = parseInt(page as string);
    limit = parseInt(limit as string);

    if (Object.keys(req.query).length > 0) {
        Object.keys(req.query).forEach((filter, index) => {
            let key_and_op = filter.split('.')
            if (key_and_op.length > 1) {
                let key = key_and_op[0]
                let op = key_and_op[1]
                let value = req.query[filter]

                if (key === 'sort') {
                    orderBy.push({
                        [op]: value
                    })
                }
            }
        })
    }

    let anime: any;
    
    const total_anime = await prisma.anime.count();
    let anime_group: Array<any> = [];

    if (search) {
        where = {
            OR: [
                {
                    title: {
                        contains: search,
                    }
                },
                {
                    slug: {
                        contains: search.toLowerCase(),
                    }
                }
            ]
        }

        anime = await prisma.anime.findMany({
          where: where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy:
            orderBy.length > 0
              ? orderBy
              : [
                  {
                    id: "asc",
                  },
                ],
            include: {
                genres: {
                    include: {
                        genre: {
                            select: {
                                name: true,
                                slug: true,
                            }
                        }
                    }
                },
            }
        });

        await Promise.all(anime.map(async (item: any) => {
            item.genres = item.genres.map((genre: any) => genre.genre)
        }))
    } else {
        limit = 1000;
        anime = await prisma.anime.findMany({
            where: where,
            select: {
                id: true,
                title: true,
                slug: true,
                image: true,
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy:
                orderBy.length > 0
                ? orderBy
                : [
                    {
                        title: "asc",
                    },
                ],
        });

        anime.forEach((item: any) => {
          let first_letter = item.title.charAt(0).toUpperCase();
          let index = anime_group.findIndex(
            (group: any) => group.letter === first_letter
          );
          if (index === -1) {
            anime_group.push({
              letter: first_letter,
              anime: [item],
            });
          } else {
            anime_group[index].anime.push(item);
          }
        });
    }

    res.json(new sendResponse(!search ? anime_group : anime, 'Success getting data', pagination(page, limit, total_anime)))
})

const animeView = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    let anime: any = await prisma.anime.findFirst({
        where: {
            slug: slug,
        },
        include: {
            genres: {
                include: {
                    genre: {
                        select: {
                            name: true,
                            slug: true,
                        }
                    }
                }
            },
            seasons: {
                include: {
                    season: {
                        select: {
                            name: true,
                            slug: true,
                        }
                    }
                }
            },
            downloads: {
                select: {
                    id: true,
                    quality: true,
                    name: true,
                    url: true,
                }
            }
        }
    });

    anime.genres = anime.genres.map((genre: any) => genre.genre);
    anime.seasons = anime.seasons.map((season: any) => season.season);

    // quality group downloads
    let quality_group: any = [];
    anime.downloads.forEach((download: any) => {
      let quality = quality_group.find(
        (quality: any) => quality.quality === download.quality
      );
      if (!quality) {
        quality_group.push({
          quality: download.quality,
          downloads: [download],
        });
      } else {
        quality.downloads.push(download);
      }
    });

    anime.downloads = quality_group;

    res.json(new sendResponse(anime, 'Success getting data'))
})

const genres = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const genres = await prisma.genre.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
        }
    });

    res.json(new sendResponse(genres, 'Success getting data'))
})

const genre = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const { slug } = req.params;
    let { search, page = 1, limit = 10 } = req.query;
    let orderBy: Array<any> = [],
      where: any;
    page = parseInt(page as string);
    limit = parseInt(limit as string);

    if (Object.keys(req.query).length > 0) {
      Object.keys(req.query).forEach((filter, index) => {
        let key_and_op = filter.split(".");
        if (key_and_op.length > 1) {
          let key = key_and_op[0];
          let op = key_and_op[1];
          let value = req.query[filter];

          if (key === "sort") {
            orderBy.push({
              [op]: value,
            });
          }
        }
      });
    }

    const genre = await prisma.genre.findFirst({
        where: {
            slug: slug,
        },
        include: {
            anime_genres: {
                take: limit,
                skip: (page - 1) * limit,
                orderBy: orderBy.length > 0 ? orderBy : [
                    {
                        id: 'desc'
                    }
                ],
                include: {
                    anime: true,
                }
            }
        },
    })

    if (!genre) {
        return next(new sendError('Genre not found', [], 'NOT_FOUND', 404))
    }

    const total_anime = await prisma.animeGenre.count({
        where: {
            genre_id: genre.id
        }
    })

    let posts : Array<any> = [];
    genre.anime_genres.forEach((anime: any) => {
        posts.push(anime.anime)
    })

    res.json(new sendResponse(posts, 'Success getting data genre ' + genre.name, pagination(page, limit, total_anime)))
})

const seasons = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const seasons = await prisma.season.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
        }
    })

    res.json(new sendResponse(seasons, 'Success getting data'))
})

const season = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const { slug } = req.params;
     let { search, page = 1, limit = 10 } = req.query;
     let orderBy: Array<any> = [],
       where: any;
     page = parseInt(page as string);
     limit = parseInt(limit as string);

     if (Object.keys(req.query).length > 0) {
       Object.keys(req.query).forEach((filter, index) => {
         let key_and_op = filter.split(".");
         if (key_and_op.length > 1) {
           let key = key_and_op[0];
           let op = key_and_op[1];
           let value = req.query[filter];

           if (key === "sort") {
             orderBy.push({
               [op]: value,
             });
           }
         }
       });
     }

    const season = await prisma.season.findFirst({
        where: {
            slug: slug,
        },
        include: {
            anime_seasons: {
                include: {
                    anime: true,
                },
                take: limit,
                skip: (page - 1) * limit,
            },
        },
        
    })

    if (!season) {
        return next(new sendError('Season not found', [], 'NOT_FOUND', 404))
    }

    const total_anime = await prisma.animeSeason.count({
        where: {
            season_id: season.id
        }
    })

    let posts : Array<any> = [];
    season.anime_seasons.forEach((anime: any) => {
        posts.push(anime.anime)
    })

    res.json(new sendResponse(posts, 'Success getting data season ' + season.name, pagination(page, limit, total_anime)))
})

export {
    home,
    animelist,
    animeView,
    genres,
    genre,
    seasons,
    season,
}