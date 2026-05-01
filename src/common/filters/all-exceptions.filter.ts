import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { HttpResponse, IServiceResponse } from "semantic-response";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse<Response>();

		let body: IServiceResponse<unknown, unknown>;

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const responseBody = exception.getResponse();
			const message = typeof responseBody === "string" ? responseBody : ((responseBody as any)?.message ?? exception.message);
			body = {
				status,
				success: false,
				message: Array.isArray(message) ? message.join("; ") : message,
				error: {
					message: Array.isArray(message) ? message.join("; ") : message,
					data: typeof responseBody === "object" ? responseBody : undefined,
				},
			};
		} else {
			this.logger.error(exception instanceof Error ? exception.stack : String(exception));
			body = HttpResponse.internalServerError(
				{
					message: exception instanceof Error ? exception.message : "Erro interno",
				},
				"Erro interno do servidor",
			);
		}

		res.status(body.status ?? HttpStatus.INTERNAL_SERVER_ERROR).json(body);
	}
}
