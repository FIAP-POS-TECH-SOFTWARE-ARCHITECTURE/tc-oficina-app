import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateInsumoDto } from "./dto/create-insumo.dto";
import { AjusteInsumoDto, EntradaInsumoDto } from "./dto/movimento.dto";
import { UpdateInsumoDto } from "./dto/update-insumo.dto";
import { InsumosService } from "./insumos.service";
import { InsumoResponseDto } from "./dto/insumo-response.dto";
import { MovimentoEstoqueResponseDto } from "./dto/movimento-estoque-response.dto";

@ApiTags("Insumos/Estoque")
@ApiBearerAuth()
@Controller("insumos")
export class InsumosController {
	constructor(private readonly service: InsumosService) {}

	@Post()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar novo insumo" })
	@ApiEnvelopedResponse(InsumoResponseDto, { status: 201 })
	create(@Body() dto: CreateInsumoDto) {
		return this.service.create(dto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todos os insumos" })
	@ApiEnvelopedResponse(InsumoResponseDto, { isArray: true })
	findAll() {
		return this.service.findAll();
	}

	@Get("alertas/estoque-baixo")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar insumos com estoque baixo" })
	@ApiEnvelopedResponse(InsumoResponseDto, { isArray: true })
	alertas() {
		return this.service.alertasEstoqueBaixo();
	}

	@Get(":id")
	@ApiOperation({ summary: "Buscar insumo por ID" })
	@ApiEnvelopedResponse(InsumoResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do insumo" })
	@ApiEnvelopedResponse(InsumoResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateInsumoDto) {
		return this.service.update(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover insumo" })
	@ApiEnvelopedResponse(String)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}

	@Post(":id/entrada")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar entrada manual de estoque" })
	@ApiEnvelopedResponse(MovimentoEstoqueResponseDto, { status: 201 })
	entrada(@Param("id", ParseUUIDPipe) id: string, @Body() dto: EntradaInsumoDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.entrada(id, dto, user.id);
	}

	@Post(":id/ajuste")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Realizar ajuste de inventário (somente Admin)" })
	@ApiEnvelopedResponse(MovimentoEstoqueResponseDto, { status: 201 })
	ajuste(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AjusteInsumoDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.ajuste(id, dto, user.id);
	}

	@Get(":id/movimentos")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar histórico de movimentos do insumo" })
	@ApiEnvelopedResponse(MovimentoEstoqueResponseDto, { isArray: true })
	movimentos(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.listarMovimentos(id);
	}
}
