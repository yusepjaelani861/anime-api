import { NextFunction, Request, Response } from "express";
import { sendError } from "../libraries/rest";
import fs from 'fs'

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err)
    let message_error: any = ''

    message_error = 
        '=====================================' +
        'Error Code : ' + err.error?.error_code + 
        'Error Message : ' + err.message +
        'Error Data : ' + err.error?.error_data +
        '\r'+
        err.stack +
        '\r\n' + 
        '===================================== \n'

    fs.appendFile('error.log', message_error, (err) => {
        if (err) throw err;
    })

    if (typeof (err) !== 'undefined' && err.error?.error_code === 'VALIDATION_ERROR') {
        let error_validation: object | any = {}

        err.error?.error_data.forEach((element: any) => {
            error_validation[element.param] = element.msg
        })

        return res.status(422).json(new sendError(err.message, error_validation, err.error_code, 422))
    }

    if (typeof (err) !== 'undefined' && err.error?.error_code === 'NOT_FOUND') {
        return res.status(404).json(new sendError(err.message, err.error?.error_data, err.error_code, 404))
    }

    res.status(400).json(new sendError(err.message || 'Something went wrong', err.error?.error_data || [], err.error_code || 'PROCESS_ERROR', 400))
}

export default errorHandler