import asyncHandler from "../../../middleware/async";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs'
import { sendResponse, sendError } from "../../../libraries/rest";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()
const jwt_secret = process.env.JWT_SECRET || 'secret'
const jwt_expires = process.env.JWT_EXPIRES || '30d'

const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new sendError('Validation Error', errors.array(), 'VALIDATION_ERROR', 422))
    }
    
    const {
        name,
        email,
        password,
        password_confirmation
    } = req.body

    if (password !== password_confirmation) {
        return next(new sendError('Password confirmation does not match', [], 'VALIDATION_ERROR', 422))
    }

    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    })

    if (user) {
        return next(new sendError('User already exists', [], 'VALIDATION_ERROR', 422))
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: hashedPassword,
            status: 'active'
        }
    })

    const token = jwt.sign({ id: newUser.id }, jwt_secret, {
        expiresIn: jwt_expires
    })

    res.setHeader(
        'Set-Cookie',
        `token=${token}; HttpOnly; Max-Age=${jwt_expires}; Path=/; SameSite=Strict; Domain=${process.env.FRONTEND_DOMAIN}`
    )
        
    res.status(201).json(new sendResponse({ token }, 'User created successfully'))
})

const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new sendError('Validation Error', errors.array(), 'VALIDATION_ERROR', 422))
    }

    const {
        email,
        password
    } = req.body

    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    })

    if (!user) {
        return next(new sendError('Invalid credentials', [], 'VALIDATION_ERROR', 422))
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return next(new sendError('Invalid credentials', [], 'VALIDATION_ERROR', 422))
    }

    const token = jwt.sign({ id: user.id }, jwt_secret, {
        expiresIn: jwt_expires
    })

    res.setHeader(
        'Set-Cookie',
        `token=${token}; HttpOnly; Max-Age=${jwt_expires}; Path=/; SameSite=Strict; Domain=${process.env.FRONTEND_DOMAIN}`
    )

    res.status(200).json(new sendResponse({ token }, 'User logged in successfully'))
})

const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
        'Set-Cookie',
        `token=; HttpOnly; Max-Age=0; Path=/; SameSite=Strict; Domain=${process.env.FRONTEND_DOMAIN}`
    )

    res.status(200).json(new sendResponse({}, 'User logged out successfully'))
})

const validation = (method: string) => {
    switch (method) {
        case 'register': {
            return [
                body('name', 'Name is required').notEmpty(),
                body('email', 'Please include a valid email').isEmail(),
                body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
                body('password_confirmation', 'Password confirmation is required').notEmpty()
            ]   
            break;
        }

        case 'login': {
            return [
                body('email', 'Please include a valid email').isEmail(),
                body('password', 'Password is required').notEmpty()
            ]
            break;
        }

        default: {
            return []
            break;
        }
    }
}

export {
    register,
    login,
    logout,
    validation
}