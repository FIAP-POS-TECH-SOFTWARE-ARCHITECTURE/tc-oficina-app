import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { AjustarEstoqueInsumoUseCase } from "../application/use-cases/ajustar-estoque-insumo.use-case";
import { AlertasEstoqueBaixoUseCase } from "../application/use-cases/alertas-estoque-baixo.use-case";
import { AtualizarInsumoUseCase } from "../application/use-cases/atualizar-insumo.use-case";
import { BuscarInsumoUseCase } from "../application/use-cases/buscar-insumo.use-case";
import { CriarInsumoUseCase } from "../application/use-cases/criar-insumo.use-case";
import { InativarInsumoUseCase } from "../application/use-cases/inativar-insumo.use-case";
import { ListarInsumosUseCase } from "../application/use-cases/listar-insumos.use-case";
import { ListarMovimentosInsumoUseCase } from "../application/use-cases/listar-movimentos-insumo.use-case";
import { RegistrarEntradaInsumoUseCase } from "../application/use-cases/registrar-entrada-insumo.use-case";
import { CreateInsumoDto } from "../dto/create-insumo.dto";
import { InsumoResponseDto } from "../dto/insumo-response.dto";
import { MovimentoEstoqueResponseDto } from "../dto/movimento-estoque-response.dto";
import { AjusteInsumoDto, EntradaInsumoDto } from "../dto/movimento.dto";
import { UpdateInsumoDto } from "../dto/update-insumo.dto";

@ApiTags("Insumos/Estoque")
@ApiBearerAuth()
@Controller("insumos")
export class InsumosController {
	constructor(
		private readonly criarInsumo: CriarInsumoUseCase,
		private readonly listarInsumos: ListarInsumosUseCase,
		private readonly buscarInsumo: BuscarInsumoUseCase,
		private readonly atualizarInsumo: AtualizarInsumoUseCase,
		private readonly inativarInsumo: InativarInsumoUseCase,
		private readonly registrarEntradaInsumo: RegistrarEntradaInsumoUseCase,
		private readonly ajustarEstoqueInsumo: AjustarEstoqueInsumoUseCase,
		private readonly listarMovimentosInsumo: ListarMovimentosInsumoUseCase,
		private readonly alertasEstoqueBaixo: AlertasEstoqueBaixoUseCase,
	) {}

	@Post()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar novo insumo" })
	@ApiEnvelopedResponse(InsumoResponseDto, { status: 201 })
	create(@Body() dto: CreateInsumoDto) {
		return this.criarInsumo.execute(dto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todos os insumos" })
	@ApiEnvelopedResponse(InsumoResponseDto, { isArray: true })
	findAll() {
		return this.listarInsumos.execute();
	}

	@Get("alertas/estoque-baixo")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar insumos com estoque baixo" })
	@ApiEnvelopedResponse(InsumoResponseDto, { isArray: true })
	alertas() {
		return this.alertasEstoqueBaixo.execute();
	}

	@Get(":id")
	@ApiOperation({ summary: "Buscar insumo por ID" })
	@ApiEnvelopedResponse(InsumoResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.buscarInsumo.execute(id);
	}

	@Patch(":id")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do insumo" })
	@ApiEnvelopedResponse(InsumoResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateInsumoDto) {
		return this.atualizarInsumo.execute(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover insumo" })
	@ApiEnvelopedResponse(String)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.inativarInsumo.execute(id);
	}

	@Post(":id/entrada")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar entrada manual de estoque" })
	@ApiEnvelopedResponse(MovimentoEstoqueResponseDto, { status: 201 })
	entrada(@Param("id", ParseUUIDPipe) id: string, @Body() dto: EntradaInsumoDto, @CurrentUser() user: AuthenticatedUser) {
		return this.registrarEntradaInsumo.execute(id, dto, user.id);
	}

	@Post(":id/ajuste")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Realizar ajuste de inventário (somente Admin)" })
	@ApiEnvelopedResponse(MovimentoEstoqueResponseDto, { status: 201 })
	ajuste(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AjusteInsumoDto, @CurrentUser() user: AuthenticatedUser) {
		return this.ajustarEstoqueInsumo.execute(id, dto, user.id);
	}

	@Get(":id/movimentos")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar histórico de movimentos do insumo" })
	@ApiEnvelopedResponse(MovimentoEstoqueResponseDto, { isArray: true })
	movimentos(@Param("id", ParseUUIDPipe) id: string) {
		return this.listarMovimentosInsumo.execute(id);
	}
}
