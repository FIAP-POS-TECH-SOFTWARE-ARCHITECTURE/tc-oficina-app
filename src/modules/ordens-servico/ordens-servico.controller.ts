import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { AddItemInsumoDto, AddItemServicoDto } from "./dto/add-item.dto";
import { CreateOsDto } from "./dto/create-os.dto";
import { ListarOsDto } from "./dto/listar-os.dto";
import { AprovacaoPublicaDto, CancelarOsDto, DesbloquearOsDto } from "./dto/transicao.dto";
import { UpdateDiagnosticoDto } from "./dto/update-diagnostico.dto";
import { OrdensServicoService } from "./ordens-servico.service";

@Controller("os")
export class OrdensServicoController {
	constructor(private readonly service: OrdensServicoService) {}

	@Post()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	create(@Body() dto: CreateOsDto) {
		return this.service.create(dto);
	}

	@Get()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	list(@Query() query: ListarOsDto) {
		return this.service.list(query);
	}

	@Get("metricas/tempo-medio")
	@Roles(Role.ADMINISTRADOR)
	metricas() {
		return this.service.tempoMedioExecucao();
	}

	@Public()
	@Get("publica/:numero")
	consultaPublica(@Param("numero") numero: string, @Query("documento") documento: string) {
		return this.service.consultaPublica(numero, documento);
	}

	@Get(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Post(":id/diagnostico/iniciar")
	@Roles(Role.MECANICO)
	iniciarDiagnostico(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.iniciarDiagnostico(id, user.id);
	}

	@Patch(":id/diagnostico")
	@Roles(Role.MECANICO)
	atualizarDiagnostico(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateDiagnosticoDto) {
		return this.service.atualizarDiagnostico(id, dto);
	}

	@Post(":id/itens-servico")
	@Roles(Role.MECANICO)
	addItemServico(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AddItemServicoDto) {
		return this.service.addItemServico(id, dto);
	}

	@Delete(":id/itens-servico/:itemId")
	@Roles(Role.MECANICO)
	removerItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.removerItemServico(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/iniciar")
	@Roles(Role.MECANICO)
	iniciarItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.iniciarItemServico(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/concluir")
	@Roles(Role.MECANICO)
	concluirItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.concluirItemServico(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/cancelar")
	@Roles(Role.MECANICO)
	cancelarItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.cancelarItemServico(id, itemId);
	}

	@Post(":id/itens-insumo")
	@Roles(Role.MECANICO)
	addItemInsumo(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AddItemInsumoDto) {
		return this.service.addItemInsumo(id, dto);
	}

	@Delete(":id/itens-insumo/:itemId")
	@Roles(Role.MECANICO)
	removerItemInsumo(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.removerItemInsumo(id, itemId);
	}

	@Post(":id/orcamento/gerar")
	@Roles(Role.MECANICO, Role.ATENDENTE)
	gerarOrcamento(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.gerarOrcamento(id, user.id);
	}

	@Public()
	@Post(":id/orcamento/aprovar")
	aprovar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AprovacaoPublicaDto) {
		return this.service.aprovarOrcamento(id, dto);
	}

	@Public()
	@Post(":id/orcamento/rejeitar")
	rejeitar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AprovacaoPublicaDto) {
		return this.service.rejeitarOrcamento(id, dto);
	}

	@Post(":id/finalizar")
	@Roles(Role.MECANICO)
	finalizar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.finalizar(id, user.id);
	}

	@Post(":id/entregar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	entregar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.entregar(id, user.id);
	}

	@Post(":id/desbloquear")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	desbloquear(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() dto: DesbloquearOsDto,
		@CurrentUser() user: AuthenticatedUser,
	) {
		return this.service.desbloquear(id, user.id, dto);
	}

	@Post(":id/cancelar")
	@Roles(Role.ADMINISTRADOR)
	cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarOsDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.cancelar(id, user.id, dto);
	}
}
