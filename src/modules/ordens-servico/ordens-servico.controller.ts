import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
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
import { OsConsultaPublicaResponseDto, OsResponseDto } from "./dto/os-response.dto";

@ApiTags("Ordens de Serviço")
@ApiBearerAuth()
@Controller("os")
export class OrdensServicoController {
	constructor(private readonly service: OrdensServicoService) {}

	@Post()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Criar uma nova Ordem de Serviço" })
	@ApiEnvelopedResponse(OsResponseDto, { status: 201 })
	create(@Body() dto: CreateOsDto) {
		return this.service.create(dto);
	}

	@Get()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar Ordens de Serviço com filtros" })
	@ApiEnvelopedResponse(OsResponseDto, { isArray: true })
	list(@Query() query: ListarOsDto) {
		return this.service.list(query);
	}

	@Get(":id/historico")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Obter histórico de status da OS" })
	@ApiEnvelopedResponse(undefined, { isArray: true })
	obterHistorico(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.obterHistorico(id);
	}

	@Get("metricas/tempo-medio")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Obter métricas de tempo médio de execução (Somente Admin)" })
	@ApiEnvelopedResponse(undefined, { isArray: true })
	metricas() {
		return this.service.tempoMedioExecucao();
	}

	@Public()
	@Get("publica/:numero")
	@ApiOperation({ summary: "Consulta pública da OS pelo número e documento do cliente" })
	@ApiEnvelopedResponse(OsConsultaPublicaResponseDto)
	consultaPublica(@Param("numero") numero: string, @Query("documento") documento: string) {
		return this.service.consultaPublica(numero, documento);
	}

	@Get(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Buscar detalhes de uma OS por ID" })
	@ApiEnvelopedResponse(OsResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Post(":id/diagnostico/iniciar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Iniciar diagnóstico da OS (Mecânico)" })
	@ApiEnvelopedResponse(OsResponseDto)
	iniciarDiagnostico(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.iniciarDiagnostico(id, user.id);
	}

	@Patch(":id/diagnostico")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Atualizar laudo de diagnóstico" })
	@ApiEnvelopedResponse(OsResponseDto)
	atualizarDiagnostico(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateDiagnosticoDto) {
		return this.service.atualizarDiagnostico(id, dto);
	}

	@Post(":id/itens-servico")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Adicionar serviço à OS" })
	@ApiEnvelopedResponse(OsResponseDto, { status: 201 })
	addItemServico(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AddItemServicoDto) {
		return this.service.addItemServico(id, dto);
	}

	@Delete(":id/itens-servico/:itemId")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Remover serviço da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	removerItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.removerItemServico(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/iniciar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Iniciar execução de um serviço específico" })
	@ApiEnvelopedResponse(OsResponseDto)
	iniciarItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.iniciarItemServico(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/concluir")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Concluir execução de um serviço" })
	@ApiEnvelopedResponse(OsResponseDto)
	concluirItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.concluirItemServico(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/cancelar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Cancelar um serviço da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	cancelarItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.cancelarItemServico(id, itemId);
	}

	@Post(":id/itens-insumo")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Adicionar insumo à OS" })
	@ApiEnvelopedResponse(OsResponseDto, { status: 201 })
	addItemInsumo(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AddItemInsumoDto) {
		return this.service.addItemInsumo(id, dto);
	}

	@Delete(":id/itens-insumo/:itemId")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Remover insumo da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	removerItemInsumo(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.service.removerItemInsumo(id, itemId);
	}

	@Post(":id/orcamento/gerar")
	@Roles(Role.MECANICO, Role.ATENDENTE)
	@ApiOperation({ summary: "Gerar orçamento e enviar para aprovação do cliente" })
	@ApiEnvelopedResponse(OsResponseDto)
	gerarOrcamento(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.gerarOrcamento(id, user.id);
	}

	@Public()
	@Post(":id/orcamento/aprovar")
	@ApiOperation({ summary: "Aprovação de orçamento pelo cliente (público)" })
	@ApiEnvelopedResponse(OsResponseDto)
	aprovar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AprovacaoPublicaDto) {
		return this.service.aprovarOrcamento(id, dto);
	}

	@Public()
	@Post(":id/orcamento/rejeitar")
	@ApiOperation({ summary: "Rejeição de orçamento pelo cliente (público)" })
	@ApiEnvelopedResponse(OsResponseDto)
	rejeitar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AprovacaoPublicaDto) {
		return this.service.rejeitarOrcamento(id, dto);
	}

	@Post(":id/finalizar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Finalizar todos os trabalhos da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	finalizar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.finalizar(id, user.id);
	}

	@Post(":id/entregar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar entrega do veículo ao cliente" })
	@ApiEnvelopedResponse(OsResponseDto)
	entregar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.service.entregar(id, user.id);
	}

	@Post(":id/desbloquear")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Desbloquear OS que estava aguardando insumos" })
	@ApiEnvelopedResponse(OsResponseDto)
	desbloquear(@Param("id", ParseUUIDPipe) id: string, @Body() dto: DesbloquearOsDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.desbloquear(id, user.id, dto);
	}

	@Post(":id/cancelar")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cancelar OS (Somente Admin)" })
	@ApiEnvelopedResponse(OsResponseDto)
	cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarOsDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.cancelar(id, user.id, dto);
	}
}
