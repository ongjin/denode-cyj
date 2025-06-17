export class ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;

    constructor(data?: T, message = 'OK') {
        this.success = true;
        this.data = data;
        this.message = message;
    }
}

export class ApiErrorResponse {
    success: false;
    message: string;
    statusCode: number;
    error?: any;

    constructor(message: string, statusCode: number, error?: any) {
        this.success = false;
        this.message = message;
        this.statusCode = statusCode;
        this.error = error;
    }
}
