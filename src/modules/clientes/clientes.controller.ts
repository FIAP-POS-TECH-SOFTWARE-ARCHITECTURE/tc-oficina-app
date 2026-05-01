import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { ClientesService } from "./clientes.service";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";

@Controller("clientes")
export class ClientesController {
	constructor(private readonly service: ClientesService) {}

	@Post()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	create(@Body() dto: CreateClienteDto) {
		return this.service.create(dto);
	}

	@Get()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	findAll() {
		return this.service.findAll();
	}

	@Get("buscar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	findByDocumento(@Query("documento") documento: string) {
		return this.service.findByDocumento(documento);
	}

	@Get(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateClienteDto) {
		return this.service.update(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
