import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateVeiculoDto } from "./dto/create-veiculo.dto";
import { UpdateVeiculoDto } from "./dto/update-veiculo.dto";
import { VeiculosService } from "./veiculos.service";

@Controller()
export class VeiculosController {
	constructor(private readonly service: VeiculosService) {}

	@Post("clientes/:clienteId/veiculos")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	create(@Param("clienteId", ParseUUIDPipe) clienteId: string, @Body() dto: CreateVeiculoDto) {
		return this.service.create(clienteId, dto);
	}

	@Get("clientes/:clienteId/veiculos")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	findByCliente(@Param("clienteId", ParseUUIDPipe) clienteId: string) {
		return this.service.findByCliente(clienteId);
	}

	@Get("veiculos/buscar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	findByPlaca(@Query("placa") placa: string) {
		return this.service.findByPlaca(placa);
	}

	@Get("veiculos/:id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch("veiculos/:id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateVeiculoDto) {
		return this.service.update(id, dto);
	}

	@Delete("veiculos/:id")
	@Roles(Role.ADMINISTRADOR)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
