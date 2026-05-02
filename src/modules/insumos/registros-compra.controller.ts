import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CancelarRegistroCompraDto } from "./dto/cancelar-registro-compra.dto";
import { CreateRegistroCompraDto } from "./dto/create-registro-compra.dto";
import { ReceberCompraDto } from "./dto/receber-compra.dto";
import { RegistrarRespostaFornecedorDto } from "./dto/registrar-resposta-fornecedor.dto";
import { RegistrosCompraService } from "./registros-compra.service";
import { RegistroCompraResponseDto } from "./dto/registro-compra-response.dto";

@ApiTags("Insumos/Compras")
@ApiBearerAuth()
@Controller("insumos/compras")
export class RegistrosCompraController {
	constructor(private readonly service: RegistrosCompraService) {}

	@Post()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Criar solicitação de compra de insumo" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto, { status: 201 })
	create(@Body() dto: CreateRegistroCompraDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.create(dto, user.id);
	}

	@Get()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar todas as solicitações de compra" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto, { isArray: true })
	list() {
		return this.service.list();
	}

	@Get(":id")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar solicitação de compra por ID" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Post(":id/enviar-fornecedor")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Enviar solicitação para o fornecedor" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	enviarFornecedor(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.enviarFornecedor(id);
	}

	@Post(":id/resposta-fornecedor")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar resposta manual do fornecedor" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	respostaFornecedor(@Param("id", ParseUUIDPipe) id: string, @Body() dto: RegistrarRespostaFornecedorDto) {
		return this.service.registrarRespostaFornecedor(id, dto);
	}

	@Post(":id/cancelar")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cancelar solicitação de compra" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarRegistroCompraDto) {
		return this.service.cancelar(id, dto);
	}

	@Post(":id/receber")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar recebimento de insumos (com nota fiscal)" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	receber(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ReceberCompraDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.receber(id, dto, user.id);
	}
}
