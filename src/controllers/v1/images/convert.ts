import { Request, Response, NextFunction } from "express";
import { sendError, sendResponse } from "../../../libraries/rest";
import asyncHandler from "../../../middleware/async";
import Axios from "axios";
import fs from 'fs';
import path from 'path';
import sharp from "sharp";


const image = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let { url } = req.query;
    url = url as string;

    if (!url) {
        return next(new sendError("URL is required", [], "PROCESS_ERROR", 400));
    }

    const image = await Axios.get(url as string, {
        responseType: "arraybuffer"
    });

    // convert webp
    let imageSharp = sharp(image.data);

    let webp = await imageSharp.webp().toBuffer();

    res.set("Content-Type", "image/webp");
    res.send(webp);


    // let name = url.split("/").pop();
    // let title = url.split("/").slice(-3, -2).pop();
    // let chapter = url.split("/").slice(-2, -1).pop();

    // if (!fs.existsSync(path.join(__dirname, "../../../../public/komik/" + title + "/" + chapter))) {
    //     fs.mkdirSync(path.join(__dirname, "../../../../public/komik/" + title + "/" + chapter), { recursive: true });
    // }
    // if (!fs.existsSync(path.join(__dirname, "../../../../public/komik/" + title + "/" + chapter + "/" + name))) {
    //     const writer = fs.createWriteStream(path.join(__dirname, "../../../../public/komik/" + title + "/" + chapter + "/" + name));
    //     writer.write(image.data);

    //     res.set("Content-Type", image.headers["content-type"]);
    //     res.send(image.data);
    // }

    // let imageBuffer = fs.readFileSync(path.join(__dirname, "../../../../public/komik/" + title + "/" + chapter + "/" + name));
    // let imageSharp = sharp(imageBuffer);

    // let webp = await imageSharp.webp().toBuffer();

    // res.set("Content-Type", "image/webp");
    // res.send(webp);
})

export {
    image
}