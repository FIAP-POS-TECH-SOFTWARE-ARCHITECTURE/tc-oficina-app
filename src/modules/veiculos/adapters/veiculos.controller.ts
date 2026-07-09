import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { AtualizarVeiculoUseCase } from "../application/use-cases/atualizar-veiculo.use-case";
import { BuscarVeiculoPorPlacaUseCase } from "../application/use-cases/buscar-veiculo-por-placa.use-case";
import { BuscarVeiculoUseCase } from "../application/use-cases/buscar-veiculo.use-case";
import { CriarVeiculoUseCase } from "../application/use-cases/criar-veiculo.use-case";
import { InativarVeiculoUseCase } from "../application/use-cases/inativar-veiculo.use-case";
import { ListarVeiculosDoClienteUseCase } from "../application/use-cases/listar-veiculos-do-cliente.use-case";
import { CreateVeiculoDto } from "../dto/create-veiculo.dto";
import { UpdateVeiculoDto } from "../dto/update-veiculo.dto";
import { VeiculoResponseDto } from "../dto/veiculo-response.dto";

@ApiTags("Veículos")
@ApiBearerAuth()
@Controller()
export class VeiculosController {
	constructor(
		private readonly criarVeiculo: CriarVeiculoUseCase,
		private readonly listarVeiculosDoCliente: ListarVeiculosDoClienteUseCase,
		private readonly buscarVeiculo: BuscarVeiculoUseCase,
		private readonly buscarVeiculoPorPlaca: BuscarVeiculoPorPlacaUseCase,
		private readonly atualizarVeiculo: AtualizarVeiculoUseCase,
		private readonly inativarVeiculo: InativarVeiculoUseCase,
	) {}

	@Post("clientes/:clienteId/veiculos")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar veículo para um cliente" })
	@ApiEnvelopedResponse(VeiculoResponseDto, { status: 201 })
	create(@Param("clienteId", ParseUUIDPipe) clienteId: string, @Body() dto: CreateVeiculoDto) {
		return this.criarVeiculo.execute(clienteId, dto);
	}

	@Get("clientes/:clienteId/veiculos")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Listar veículos de um cliente" })
	@ApiEnvelopedResponse(VeiculoResponseDto, { isArray: true })
	findByCliente(@Param("clienteId", ParseUUIDPipe) clienteId: string) {
		return this.listarVeiculosDoCliente.execute(clienteId);
	}

	@Get("veiculos/buscar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar veículo pela placa" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	findByPlaca(@Query("placa") placa: string) {
		return this.buscarVeiculoPorPlaca.execute(placa);
	}

	@Get("veiculos/:id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Buscar veículo por ID" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.buscarVeiculo.execute(id);
	}

	@Patch("veiculos/:id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do veículo" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateVeiculoDto) {
		return this.atualizarVeiculo.execute(id, dto);
	}

	@Delete("veiculos/:id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover veículo (Admin)" })
	@ApiEnvelopedResponse(VeiculoResponseDto)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.inativarVeiculo.execute(id);
	}
}
