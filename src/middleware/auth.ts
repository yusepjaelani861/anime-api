import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { sendError } from '../libraries/rest'
import asyncHandler from './async'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const jwt_secret = process.env.JWT_SECRET || 'secret'

const protect = asyncHandler(async (req: Request | any, res: Response, next: NextFunction) => {
    let token: string,
        decoded: any

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token
    } else {
        return next(new sendError('Not authorized to access this route', [], 'UNAUTHORIZED', 401))
    }

    if (!token) {
        return next(new sendError('Not authorized to access this route', [], 'UNAUTHORIZED', 401))
    }

    decoded = jwt.verify(token, jwt_secret)

    const user = await prisma.user.findFirst({
        where: {
            id: decoded.id
        }
    })

    if (!user) {
        return next(new sendError('No authorized to access this route', [], 'UNAUTHORIZED', 401))
    }

    req.user = user

    next()
})

const withToken = asyncHandler(async (req: Request | any, res: Response, next: NextFunction) => {
    let token: string,
        decoded: any

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token
    } else {
        return next()
    }

    if (token) {
        decoded = jwt.verify(token, jwt_secret)

        const user = await prisma.user.findFirst({
            where: {
                id: decoded.id
            }
        })

        if (user) {
            req.user = user
        }

        return next()
    }

    next()
})

export { protect, withToken }