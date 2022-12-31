class sendResponse {
    success: boolean = true
    data: object | Array<any>
    error: {
        error_code: string,
        error_data: string
    }
    message: string = 'Success getting data'
    pagination: object = {}

    constructor (data: Object, message: string, pagination: object = {}, status: number = 200) {
        this.success = true
        this.data = data
        this.message = message
        this.pagination = pagination
        this.error = {
            error_code: '',
            error_data: ''
        }
    }
}

class sendError {
    success: boolean = false
    data: object | Array<any>
    error: {
        error_code: string,
        error_data: string | Array<any>
    }
    message: string = 'Error getting data'
    pagination: object = {}

    constructor (message: string, error_data: string | Array<any>, error_code: string = 'PROCESS_ERROR', status: number = 400) {
        this.success = false
        this.data = {}
        this.message = message
        this.error = {
            error_code: error_code,
            error_data: error_data
        }
        this.pagination = {}
    }
}

export {
    sendResponse,
    sendError
}