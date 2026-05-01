import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { IServiceResponse } from "semantic-response";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<IServiceResponse<T>, IServiceResponse<T>> {
	intercept(ctx: ExecutionContext, next: CallHandler): Observable<IServiceResponse<T>> {
		const res = ctx.switchToHttp().getResponse<Response>();
		return next.handle().pipe(
			map((value) => {
				if (value && typeof value === "object" && "status" in value && "success" in value) {
					const semantic = value as IServiceResponse<T>;
					res.status(semantic.status);
					return semantic;
				}

				res.status(200);
				return { status: 200, success: true, data: value } as IServiceResponse<T>;
			}),
		);
	}
}
