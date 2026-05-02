import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { OsStatus } from "../../../common/enums/os-status.enum";

export class ListarOsDto {
	@ApiProperty({ enum: OsStatus, required: false })
	@IsOptional()
	@IsEnum(OsStatus)
	status?: OsStatus;

	@ApiProperty({ example: "uuid-do-cliente", required: false })
	@IsOptional()
	@IsUUID()
	clienteId?: string;

	@ApiProperty({ example: 1, required: false, default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number;

	@ApiProperty({ example: 10, required: false, default: 10 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	pageSize?: number;
}
