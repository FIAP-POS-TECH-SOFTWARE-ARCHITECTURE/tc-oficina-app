import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { SwaggerResponseDto } from "../dto/swagger-response.dto";

export const ApiEnvelopedResponse = <TModel extends Type<any>>(
	model?: TModel,
	options: { status?: number; description?: string; isArray?: boolean } = {},
) => {
	const status = options.status || 200;
	const description = options.description || "Success";
	const isArray = options.isArray || false;

	let dataSchema: any;
	if (model) {
		const modelAsAny = model as any;
		if (modelAsAny === String || modelAsAny === Number || modelAsAny === Boolean) {
			const typeMap = { [String.name]: "string", [Number.name]: "number", [Boolean.name]: "boolean" };
			dataSchema = isArray ? { type: "array", items: { type: typeMap[modelAsAny.name] } } : { type: typeMap[modelAsAny.name] };
		} else {
			dataSchema = isArray ? { type: "array", items: { $ref: getSchemaPath(model) } } : { $ref: getSchemaPath(model) };
		}
	} else {
		dataSchema = { type: "object" };
	}

	const modelAsAny = model as any;
	return applyDecorators(
		ApiExtraModels(
			SwaggerResponseDto,
			...(model && modelAsAny !== String && modelAsAny !== Number && modelAsAny !== Boolean ? [model] : []),
		),
		ApiResponse({
			status,
			description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(SwaggerResponseDto) },
					{
						properties: {
							data: dataSchema,
						},
					},
				],
			},
		}),
	);
};
