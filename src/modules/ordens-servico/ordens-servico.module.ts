import { Module } from "@nestjs/common";
import { ClientesModule } from "../clientes/clientes.module";
import { InsumosModule } from "../insumos/insumos.module";
import { ServicosModule } from "../servicos/servicos.module";
import { VeiculosModule } from "../veiculos/veiculos.module";
import {
	ClientesConsultaPrismaGateway,
	InsumosConsultaPrismaGateway,
	ServicosConsultaPrismaGateway,
	VeiculosConsultaPrismaGateway,
} from "./adapters/gateways/consultas-externas.prisma.gateway";
import { SmtpNotificadorGateway } from "./adapters/gateways/notificador.smtp.gateway";
import { OrdensServicoPrismaGateway } from "./adapters/gateways/ordens-servico.prisma.gateway";
import { OrdensServicoController } from "./adapters/ordens-servico.controller";
import {
	CLIENTES_CONSULTA,
	INSUMOS_CONSULTA,
	SERVICOS_CONSULTA,
	VEICULOS_CONSULTA,
} from "./application/ports/consultas-externas.gateway";
import { NOTIFICADOR } from "./application/ports/notificador.gateway";
import { ORDENS_SERVICO_GATEWAY } from "./application/ports/ordens-servico.gateway";
import { AddItemInsumoUseCase } from "./application/use-cases/add-item-insumo.use-case";
import { AddItemServicoUseCase } from "./application/use-cases/add-item-servico.use-case";
import { AprovarOrcamentoUseCase } from "./application/use-cases/aprovar-orcamento.use-case";
import { AtualizarDiagnosticoUseCase } from "./application/use-cases/atualizar-diagnostico.use-case";
import { BuscarOsUseCase } from "./application/use-cases/buscar-os.use-case";
import { CancelarItemServicoUseCase } from "./application/use-cases/cancelar-item-servico.use-case";
import { CancelarOsUseCase } from "./application/use-cases/cancelar-os.use-case";
import { ConcluirItemServicoUseCase } from "./application/use-cases/concluir-item-servico.use-case";
import { ConsultaPublicaOsUseCase } from "./application/use-cases/consulta-publica-os.use-case";
import { CriarOsUseCase } from "./application/use-cases/criar-os.use-case";
import { DesbloquearOsUseCase } from "./application/use-cases/desbloquear-os.use-case";
import { EntregarOsUseCase } from "./application/use-cases/entregar-os.use-case";
import { FinalizarOsUseCase } from "./application/use-cases/finalizar-os.use-case";
import { GerarOrcamentoUseCase } from "./application/use-cases/gerar-orcamento.use-case";
import { HistoricoOsUseCase } from "./application/use-cases/historico-os.use-case";
import { IniciarDiagnosticoUseCase } from "./application/use-cases/iniciar-diagnostico.use-case";
import { IniciarItemServicoUseCase } from "./application/use-cases/iniciar-item-servico.use-case";
import { ListarOsUseCase } from "./application/use-cases/listar-os.use-case";
import { RejeitarOrcamentoUseCase } from "./application/use-cases/rejeitar-orcamento.use-case";
import { RemoverItemInsumoUseCase } from "./application/use-cases/remover-item-insumo.use-case";
import { RemoverItemServicoUseCase } from "./application/use-cases/remover-item-servico.use-case";
import { TempoMedioServicosUseCase } from "./application/use-cases/tempo-medio-servicos.use-case";

const useCases = [
	CriarOsUseCase,
	ListarOsUseCase,
	BuscarOsUseCase,
	HistoricoOsUseCase,
	TempoMedioServicosUseCase,
	ConsultaPublicaOsUseCase,
	IniciarDiagnosticoUseCase,
	AtualizarDiagnosticoUseCase,
	AddItemServicoUseCase,
	RemoverItemServicoUseCase,
	IniciarItemServicoUseCase,
	ConcluirItemServicoUseCase,
	CancelarItemServicoUseCase,
	AddItemInsumoUseCase,
	RemoverItemInsumoUseCase,
	GerarOrcamentoUseCase,
	AprovarOrcamentoUseCase,
	RejeitarOrcamentoUseCase,
	FinalizarOsUseCase,
	EntregarOsUseCase,
	DesbloquearOsUseCase,
	CancelarOsUseCase,
];

@Module({
	imports: [ClientesModule, VeiculosModule, ServicosModule, InsumosModule],
	controllers: [OrdensServicoController],
	providers: [
		...useCases,
		{ provide: ORDENS_SERVICO_GATEWAY, useClass: OrdensServicoPrismaGateway },
		{ provide: CLIENTES_CONSULTA, useClass: ClientesConsultaPrismaGateway },
		{ provide: VEICULOS_CONSULTA, useClass: VeiculosConsultaPrismaGateway },
		{ provide: SERVICOS_CONSULTA, useClass: ServicosConsultaPrismaGateway },
		{ provide: INSUMOS_CONSULTA, useClass: InsumosConsultaPrismaGateway },
		{ provide: NOTIFICADOR, useClass: SmtpNotificadorGateway },
	],
})
export class OrdensServicoModule {}
