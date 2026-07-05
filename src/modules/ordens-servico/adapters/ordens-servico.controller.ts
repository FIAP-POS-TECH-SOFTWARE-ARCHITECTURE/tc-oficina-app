import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { AddItemInsumoDto, AddItemServicoDto } from "../dto/add-item.dto";
import { CreateOsDto } from "../dto/create-os.dto";
import { ListarOsDto } from "../dto/listar-os.dto";
import { MetricasTempoMedioDto } from "../dto/metricas-tempo-medio.dto";
import { OsConsultaPublicaResponseDto, OsResponseDto } from "../dto/os-response.dto";
import { TempoMedioServicoResponseDto } from "../dto/tempo-medio-servico-response.dto";
import { AprovacaoPublicaDto, CancelarOsDto, DesbloquearOsDto } from "../dto/transicao.dto";
import { UpdateDiagnosticoDto } from "../dto/update-diagnostico.dto";
import { OsStatus } from "../domain/os-status";
import { AddItemInsumoUseCase } from "../application/use-cases/add-item-insumo.use-case";
import { AddItemServicoUseCase } from "../application/use-cases/add-item-servico.use-case";
import { AprovarOrcamentoUseCase } from "../application/use-cases/aprovar-orcamento.use-case";
import { AtualizarDiagnosticoUseCase } from "../application/use-cases/atualizar-diagnostico.use-case";
import { BuscarOsUseCase } from "../application/use-cases/buscar-os.use-case";
import { CancelarItemServicoUseCase } from "../application/use-cases/cancelar-item-servico.use-case";
import { CancelarOsUseCase } from "../application/use-cases/cancelar-os.use-case";
import { ConcluirItemServicoUseCase } from "../application/use-cases/concluir-item-servico.use-case";
import { ConsultaPublicaOsUseCase } from "../application/use-cases/consulta-publica-os.use-case";
import { CriarOsUseCase } from "../application/use-cases/criar-os.use-case";
import { DesbloquearOsUseCase } from "../application/use-cases/desbloquear-os.use-case";
import { EntregarOsUseCase } from "../application/use-cases/entregar-os.use-case";
import { FinalizarOsUseCase } from "../application/use-cases/finalizar-os.use-case";
import { GerarOrcamentoUseCase } from "../application/use-cases/gerar-orcamento.use-case";
import { HistoricoOsUseCase } from "../application/use-cases/historico-os.use-case";
import { IniciarDiagnosticoUseCase } from "../application/use-cases/iniciar-diagnostico.use-case";
import { IniciarItemServicoUseCase } from "../application/use-cases/iniciar-item-servico.use-case";
import { ListarOsUseCase } from "../application/use-cases/listar-os.use-case";
import { RejeitarOrcamentoUseCase } from "../application/use-cases/rejeitar-orcamento.use-case";
import { RemoverItemInsumoUseCase } from "../application/use-cases/remover-item-insumo.use-case";
import { RemoverItemServicoUseCase } from "../application/use-cases/remover-item-servico.use-case";
import { TempoMedioServicosUseCase } from "../application/use-cases/tempo-medio-servicos.use-case";

@ApiTags("Ordens de Serviço")
@ApiBearerAuth()
@Controller("os")
export class OrdensServicoController {
	constructor(
		private readonly criarOs: CriarOsUseCase,
		private readonly listarOs: ListarOsUseCase,
		private readonly buscarOs: BuscarOsUseCase,
		private readonly historicoOs: HistoricoOsUseCase,
		private readonly tempoMedioServicos: TempoMedioServicosUseCase,
		private readonly consultaPublicaOs: ConsultaPublicaOsUseCase,
		private readonly iniciarDiagnosticoUc: IniciarDiagnosticoUseCase,
		private readonly atualizarDiagnosticoUc: AtualizarDiagnosticoUseCase,
		private readonly addItemServicoUc: AddItemServicoUseCase,
		private readonly removerItemServicoUc: RemoverItemServicoUseCase,
		private readonly iniciarItemServicoUc: IniciarItemServicoUseCase,
		private readonly concluirItemServicoUc: ConcluirItemServicoUseCase,
		private readonly cancelarItemServicoUc: CancelarItemServicoUseCase,
		private readonly addItemInsumoUc: AddItemInsumoUseCase,
		private readonly removerItemInsumoUc: RemoverItemInsumoUseCase,
		private readonly gerarOrcamentoUc: GerarOrcamentoUseCase,
		private readonly aprovarOrcamentoUc: AprovarOrcamentoUseCase,
		private readonly rejeitarOrcamentoUc: RejeitarOrcamentoUseCase,
		private readonly finalizarOs: FinalizarOsUseCase,
		private readonly entregarOs: EntregarOsUseCase,
		private readonly desbloquearOs: DesbloquearOsUseCase,
		private readonly cancelarOs: CancelarOsUseCase,
	) {}

	@Post()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Criar uma nova Ordem de Serviço" })
	@ApiEnvelopedResponse(OsResponseDto, { status: 201 })
	create(@Body() dto: CreateOsDto) {
		return this.criarOs.execute(dto);
	}

	@Get()
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar Ordens de Serviço com filtros" })
	@ApiEnvelopedResponse(OsResponseDto, { isArray: true })
	list(@Query() query: ListarOsDto) {
		// Fronteira adapter → aplicação: enums Prisma e de domínio têm valores string idênticos
		return this.listarOs.execute({ ...query, status: query.status as OsStatus | undefined });
	}

	@Get(":id/historico")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Obter histórico de status da OS" })
	@ApiEnvelopedResponse(undefined, { isArray: true })
	obterHistorico(@Param("id", ParseUUIDPipe) id: string) {
		return this.historicoOs.execute(id);
	}

	@Get("metricas/tempo-medio")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Tempo médio de execução por serviço (Somente Admin)" })
	@ApiEnvelopedResponse(TempoMedioServicoResponseDto, { isArray: true })
	metricas(@Query() query: MetricasTempoMedioDto) {
		return this.tempoMedioServicos.execute(query.filtro);
	}

	@Public()
	@Get("publica/:numero")
	@ApiOperation({ summary: "Consulta pública da OS pelo número e documento do cliente" })
	@ApiEnvelopedResponse(OsConsultaPublicaResponseDto)
	consultaPublica(@Param("numero") numero: string, @Query("documento") documento: string) {
		return this.consultaPublicaOs.execute(numero, documento);
	}

	@Get(":id")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR, Role.MECANICO)
	@ApiOperation({ summary: "Buscar detalhes de uma OS por ID" })
	@ApiEnvelopedResponse(OsResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.buscarOs.execute(id);
	}

	@Post(":id/diagnostico/iniciar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Iniciar diagnóstico da OS (Mecânico)" })
	@ApiEnvelopedResponse(OsResponseDto)
	iniciarDiagnostico(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.iniciarDiagnosticoUc.execute(id, user.id);
	}

	@Patch(":id/diagnostico")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Atualizar laudo de diagnóstico" })
	@ApiEnvelopedResponse(OsResponseDto)
	atualizarDiagnostico(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateDiagnosticoDto) {
		return this.atualizarDiagnosticoUc.execute(id, dto);
	}

	@Post(":id/itens-servico")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Adicionar serviço à OS" })
	@ApiEnvelopedResponse(OsResponseDto, { status: 201 })
	addItemServico(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AddItemServicoDto) {
		return this.addItemServicoUc.execute(id, dto);
	}

	@Delete(":id/itens-servico/:itemId")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Remover serviço da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	removerItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.removerItemServicoUc.execute(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/iniciar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Iniciar execução de um serviço específico" })
	@ApiEnvelopedResponse(OsResponseDto)
	iniciarItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.iniciarItemServicoUc.execute(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/concluir")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Concluir execução de um serviço" })
	@ApiEnvelopedResponse(OsResponseDto)
	concluirItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.concluirItemServicoUc.execute(id, itemId);
	}

	@Post(":id/itens-servico/:itemId/cancelar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Cancelar um serviço da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	cancelarItemServico(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.cancelarItemServicoUc.execute(id, itemId);
	}

	@Post(":id/itens-insumo")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Adicionar insumo à OS" })
	@ApiEnvelopedResponse(OsResponseDto, { status: 201 })
	addItemInsumo(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AddItemInsumoDto) {
		return this.addItemInsumoUc.execute(id, dto);
	}

	@Delete(":id/itens-insumo/:itemId")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Remover insumo da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	removerItemInsumo(@Param("id", ParseUUIDPipe) id: string, @Param("itemId", ParseUUIDPipe) itemId: string) {
		return this.removerItemInsumoUc.execute(id, itemId);
	}

	@Post(":id/orcamento/gerar")
	@Roles(Role.MECANICO, Role.ATENDENTE)
	@ApiOperation({ summary: "Gerar orçamento e enviar para aprovação do cliente" })
	@ApiEnvelopedResponse(OsResponseDto)
	gerarOrcamento(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.gerarOrcamentoUc.execute(id, user.id);
	}

	@Public()
	@Post(":numero/orcamento/aprovar")
	@ApiOperation({ summary: "Aprovação de orçamento pelo cliente (público)" })
	@ApiEnvelopedResponse(OsResponseDto)
	aprovar(@Param("numero") numero: string, @Body() dto: AprovacaoPublicaDto) {
		return this.aprovarOrcamentoUc.execute(numero, dto);
	}

	@Public()
	@Post(":numero/orcamento/rejeitar")
	@ApiOperation({ summary: "Rejeição de orçamento pelo cliente (público)" })
	@ApiEnvelopedResponse(OsResponseDto)
	rejeitar(@Param("numero") numero: string, @Body() dto: AprovacaoPublicaDto) {
		return this.rejeitarOrcamentoUc.execute(numero, dto);
	}

	@Post(":id/finalizar")
	@Roles(Role.MECANICO)
	@ApiOperation({ summary: "Finalizar todos os trabalhos da OS" })
	@ApiEnvelopedResponse(OsResponseDto)
	finalizar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.finalizarOs.execute(id, user.id);
	}

	@Post(":id/entregar")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Registrar entrega do veículo ao cliente" })
	@ApiEnvelopedResponse(OsResponseDto)
	entregar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
		return this.entregarOs.execute(id, user.id);
	}

	@Post(":id/desbloquear")
	@Roles(Role.ATENDENTE, Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Desbloquear OS que estava aguardando insumos" })
	@ApiEnvelopedResponse(OsResponseDto)
	desbloquear(@Param("id", ParseUUIDPipe) id: string, @Body() dto: DesbloquearOsDto, @CurrentUser() user: AuthenticatedUser) {
		return this.desbloquearOs.execute(id, user.id, dto);
	}

	@Post(":id/cancelar")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cancelar OS (Somente Admin)" })
	@ApiEnvelopedResponse(OsResponseDto)
	cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarOsDto, @CurrentUser() user: AuthenticatedUser) {
		return this.cancelarOs.execute(id, user.id, dto);
	}
}
