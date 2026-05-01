import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateInsumoDto } from "./dto/create-insumo.dto";
import { AjusteInsumoDto, EntradaInsumoDto } from "./dto/movimento.dto";
import { UpdateInsumoDto } from "./dto/update-insumo.dto";
import { InsumosService } from "./insumos.service";

@Controller("insumos")
export class InsumosController {
	constructor(private readonly service: InsumosService) {}

	@Post()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	create(@Body() dto: CreateInsumoDto) {
		return this.service.create(dto);
	}

	@Get()
	findAll() {
		return this.service.findAll();
	}

	@Get("alertas/estoque-baixo")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	alertas() {
		return this.service.alertasEstoqueBaixo();
	}

	@Get(":id")
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateInsumoDto) {
		return this.service.update(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}

	@Post(":id/entrada")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	entrada(@Param("id", ParseUUIDPipe) id: string, @Body() dto: EntradaInsumoDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.entrada(id, dto, user.id);
	}

	@Post(":id/ajuste")
	@Roles(Role.ADMINISTRADOR)
	ajuste(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AjusteInsumoDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.ajuste(id, dto, user.id);
	}

	@Get(":id/movimentos")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	movimentos(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.listarMovimentos(id);
	}
}
