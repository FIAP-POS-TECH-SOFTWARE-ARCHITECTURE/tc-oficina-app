import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { OsStatus } from "../../../common/enums/os-status.enum";

export class ListarOsDto {
	@IsOptional()
	@IsEnum(OsStatus)
	status?: OsStatus;

	@IsOptional()
	@IsUUID()
	clienteId?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	pageSize?: number;
}
