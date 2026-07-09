import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { BuscarRegistroCompraUseCase } from "../application/use-cases/buscar-registro-compra.use-case";
import { CancelarRegistroCompraUseCase } from "../application/use-cases/cancelar-registro-compra.use-case";
import { CriarRegistroCompraUseCase } from "../application/use-cases/criar-registro-compra.use-case";
import { EnviarFornecedorUseCase } from "../application/use-cases/enviar-fornecedor.use-case";
import { ListarRegistrosCompraUseCase } from "../application/use-cases/listar-registros-compra.use-case";
import { ReceberCompraUseCase } from "../application/use-cases/receber-compra.use-case";
import { RegistrarRespostaFornecedorUseCase } from "../application/use-cases/registrar-resposta-fornecedor.use-case";
import { CancelarRegistroCompraDto } from "../dto/cancelar-registro-compra.dto";
import { CreateRegistroCompraDto } from "../dto/create-registro-compra.dto";
import { ReceberCompraDto } from "../dto/receber-compra.dto";
import { RegistrarRespostaFornecedorDto } from "../dto/registrar-resposta-fornecedor.dto";
import { RegistroCompraResponseDto } from "../dto/registro-compra-response.dto";

@ApiTags("Insumos/Compras")
@ApiBearerAuth()
@Controller("insumos/compras")
export class RegistrosCompraController {
	constructor(
		private readonly criarRegistroCompra: CriarRegistroCompraUseCase,
		private readonly listarRegistrosCompra: ListarRegistrosCompraUseCase,
		private readonly buscarRegistroCompra: BuscarRegistroCompraUseCase,
		private readonly enviarFornecedorUc: EnviarFornecedorUseCase,
		private readonly registrarRespostaFornecedorUc: RegistrarRespostaFornecedorUseCase,
		private readonly cancelarRegistroCompra: CancelarRegistroCompraUseCase,
		private readonly receberCompra: ReceberCompraUseCase,
	) {}

	@Post()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Criar solicitação de compra de insumo" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto, { status: 201 })
	create(@Body() dto: CreateRegistroCompraDto, @CurrentUser() user: AuthenticatedUser) {
		return this.criarRegistroCompra.execute(dto, user.id);
	}

	@Get()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar todas as solicitações de compra" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto, { isArray: true })
	list() {
		return this.listarRegistrosCompra.execute();
	}

	@Get(":id")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar solicitação de compra por ID" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.buscarRegistroCompra.execute(id);
	}

	@Post(":id/enviar-fornecedor")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Enviar solicitação para o fornecedor" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	enviarFornecedor(@Param("id", ParseUUIDPipe) id: string) {
		return this.enviarFornecedorUc.execute(id);
	}

	@Post(":id/resposta-fornecedor")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar resposta manual do fornecedor" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	respostaFornecedor(@Param("id", ParseUUIDPipe) id: string, @Body() dto: RegistrarRespostaFornecedorDto) {
		return this.registrarRespostaFornecedorUc.execute(id, dto);
	}

	@Post(":id/cancelar")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cancelar solicitação de compra" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarRegistroCompraDto) {
		return this.cancelarRegistroCompra.execute(id, dto);
	}

	@Post(":id/receber")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar recebimento de insumos (com nota fiscal)" })
	@ApiEnvelopedResponse(RegistroCompraResponseDto)
	receber(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ReceberCompraDto, @CurrentUser() user: AuthenticatedUser) {
		return this.receberCompra.execute(id, dto, user.id);
	}
}
