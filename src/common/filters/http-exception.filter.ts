import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../response/ApiResponse';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = exception;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res: any = exception.getResponse();
            message = res.message || res || exception.message;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        response.status(status).json(
            new ApiErrorResponse(message, status, {
                path: request.url,
                method: request.method,
            }),
        );
    }
}
