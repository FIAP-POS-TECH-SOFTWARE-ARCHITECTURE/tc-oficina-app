import { HttpResponse, IServiceResponse } from "semantic-response";

type ErrorBuilder = (error?: any, message?: string) => IServiceResponse<null, any>;

const wrap =
	<T>(fn: ErrorBuilder) =>
	(error?: any, message?: string): IServiceResponse<T> =>
		fn(error, message) as unknown as IServiceResponse<T>;

export const SR = {
	ok: <T>(data: T, message?: string) => HttpResponse.ok<T>(data, message),
	created: <T>(data: T, message?: string) => HttpResponse.created<T>(data, message),
	noContent: <T = unknown>(message?: string) => HttpResponse.noContent(message) as unknown as IServiceResponse<T>,
	badRequest: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.badRequest)(error, message),
	unauthorized: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.unauthorized)(error, message),
	forbidden: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.forbidden)(error, message),
	notFound: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.notFound)(error, message),
	conflict: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.conflict)(error, message),
	unprocessableEntity: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.unprocessableEntity)(error, message),
	internalServerError: <T = unknown>(error?: any, message?: string) => wrap<T>(HttpResponse.internalServerError)(error, message),
};
