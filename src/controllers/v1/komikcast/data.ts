import { PrismaClient } from "@prisma/client";
import asyncHandler from "../../../middleware/async";
import { NextFunction, Request, Response } from "express";
import pagination from "../../../libraries/pagination";
import { sendError, sendResponse } from "../../../libraries/rest";

const prisma = new PrismaClient();

const listKomik = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

    if (search) {
        where = {
            title: {
                contains: search,
            },
        };
    }

    const total = await prisma.komik.count({
        where: where,
    });

    const komik = await prisma.komik.findMany({
        where: where,
        orderBy: orderBy.length > 0 ? orderBy : [
            {
                title: "asc",
            }
        ],
        skip: (page - 1) * limit,
        take: limit,
    });

    res.json(new sendResponse({ komik }, "Success getting data", pagination(page, limit, total)));
})

const detailKomik = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    let komik: any = await prisma.komik.findUnique({
        where: {
            slug: slug,
        },
        include: {
            chapters: {
                orderBy: {
                    title: "asc",
                }
            },
            genres: {
                include: {
                    genre: true
                }
            },
            types: {
                include: {
                    type: true
                }
            }
        }
    });

    if (!komik) {
        return next(new sendError("Komik not found", [], 'NOT_FOUND', 404));
    }

    komik.genres = komik.genres.map((genre: any) => genre.genre);
    komik.types = komik.types.map((type: any) => type.type);

    res.json(new sendResponse(komik, "Success getting data"));
})

const viewChapter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    let chapter: any = await prisma.komikChapter.findFirst({
        where: {
            slug: slug,
        },
        include: {
            komik: true,
            images: {
                orderBy: {
                    index: "asc",
                }
            }
        }
    })

    if (!chapter) {
        return next(new sendError("Chapter not found", [], 'NOT_FOUND', 404));
    }

    res.json(new sendResponse(chapter, "Success getting data"));
})

const homePage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let { page = 1, limit = 28 } = req.query;
    page = parseInt(page as string);
    limit = parseInt(limit as string);

    let komik: any = await prisma.komik.findMany({
        orderBy: {
            id: "desc",
        },
        take: limit,
        skip: (page - 1) * limit,
    });

    await Promise.all(komik.map(async (item: any) => {
        const last_chapter: any = await prisma.komikChapter.findFirst({
            where: {
                komik_id: item.id,
            },
            orderBy: {
                title: "desc",
            }
        })
        if (!last_chapter) {
            item.new_chapter = {
                chapter: "No chapter",
                slug: "",
            }
        } else {
            item.new_chapter = {
                chapter: last_chapter.title,
                slug: last_chapter.slug,
            }
        }
    }))

    let total = await prisma.komik.count();

    res.json(new sendResponse(komik, "Success getting data", pagination(page, limit, total)));
})

export {
    listKomik,
    detailKomik,
    viewChapter,
    homePage,
}