import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { AtualizarClienteUseCase } from "../application/use-cases/atualizar-cliente.use-case";
import { BuscarClientePorDocumentoUseCase } from "../application/use-cases/buscar-cliente-por-documento.use-case";
import { BuscarClienteUseCase } from "../application/use-cases/buscar-cliente.use-case";
import { CriarClienteUseCase } from "../application/use-cases/criar-cliente.use-case";
import { InativarClienteUseCase } from "../application/use-cases/inativar-cliente.use-case";
import { ListarClientesUseCase } from "../application/use-cases/listar-clientes.use-case";
import { ClienteResponseDto } from "../dto/cliente-response.dto";
import { CreateClienteDto } from "../dto/create-cliente.dto";
import { UpdateClienteDto } from "../dto/update-cliente.dto";

@ApiTags("Clientes")
@ApiBearerAuth()
@Controller("clientes")
export class ClientesController {
	constructor(
		private readonly criarCliente: CriarClienteUseCase,
		private readonly listarClientes: ListarClientesUseCase,
		private readonly buscarCliente: BuscarClienteUseCase,
		private readonly buscarClientePorDocumento: BuscarClientePorDocumentoUseCase,
		private readonly atualizarCliente: AtualizarClienteUseCase,
		private readonly inativarCliente: InativarClienteUseCase,
	) {}

	@Post()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar novo cliente" })
	@ApiEnvelopedResponse(ClienteResponseDto, { status: 201 })
	create(@Body() dto: CreateClienteDto) {
		return this.criarCliente.execute(dto);
	}

	@Get()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Listar todos os clientes" })
	@ApiEnvelopedResponse(ClienteResponseDto, { isArray: true })
	findAll() {
		return this.listarClientes.execute();
	}

	@Get("buscar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar cliente por documento (CPF/CNPJ)" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	findByDocumento(@Query("documento") documento: string) {
		return this.buscarClientePorDocumento.execute(documento);
	}

	@Get(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Buscar cliente por ID" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.buscarCliente.execute(id);
	}

	@Patch(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do cliente" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateClienteDto) {
		return this.atualizarCliente.execute(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover cliente" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.inativarCliente.execute(id);
	}
}
