import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { ClientesService } from "./clientes.service";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";
import { ClienteResponseDto } from "./dto/cliente-response.dto";

@ApiTags("Clientes")
@ApiBearerAuth()
@Controller("clientes")
export class ClientesController {
	constructor(private readonly service: ClientesService) {}

	@Post()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar novo cliente" })
	@ApiEnvelopedResponse(ClienteResponseDto, { status: 201 })
	create(@Body() dto: CreateClienteDto) {
		return this.service.create(dto);
	}

	@Get()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Listar todos os clientes" })
	@ApiEnvelopedResponse(ClienteResponseDto, { isArray: true })
	findAll() {
		return this.service.findAll();
	}

	@Get("buscar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar cliente por documento (CPF/CNPJ)" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	findByDocumento(@Query("documento") documento: string) {
		return this.service.findByDocumento(documento);
	}

	@Get(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Buscar cliente por ID" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do cliente" })
	@ApiEnvelopedResponse(ClienteResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateClienteDto) {
		return this.service.update(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover cliente" })
	@ApiEnvelopedResponse(String)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
