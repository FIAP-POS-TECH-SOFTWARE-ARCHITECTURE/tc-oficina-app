import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateVeiculoDto } from "./dto/create-veiculo.dto";
import { UpdateVeiculoDto } from "./dto/update-veiculo.dto";
import { VeiculosService } from "./veiculos.service";
import { VeiculoResponseDto } from "./dto/veiculo-response.dto";

@ApiTags("Veículos")
@ApiBearerAuth()
@Controller()
export class VeiculosController {
	constructor(private readonly service: VeiculosService) {}

	@Post("clientes/:clienteId/veiculos")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar veículo para um cliente" })
	@ApiEnvelopedResponse(VeiculoResponseDto, { status: 201 })
	create(@Param("clienteId", ParseUUIDPipe) clienteId: string, @Body() dto: CreateVeiculoDto) {
		return this.service.create(clienteId, dto);
	}

	@Get("clientes/:clienteId/veiculos")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Listar veículos de um cliente" })
	@ApiEnvelopedResponse(VeiculoResponseDto, { isArray: true })
	findByCliente(@Param("clienteId", ParseUUIDPipe) clienteId: string) {
		return this.service.findByCliente(clienteId);
	}

	@Get("veiculos/buscar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar veículo pela placa" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	findByPlaca(@Query("placa") placa: string) {
		return this.service.findByPlaca(placa);
	}

	@Get("veiculos/:id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Buscar veículo por ID" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch("veiculos/:id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do veículo" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateVeiculoDto) {
		return this.service.update(id, dto);
	}

	@Delete("veiculos/:id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover veículo (Admin)" })
	@ApiEnvelopedResponse(String)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
