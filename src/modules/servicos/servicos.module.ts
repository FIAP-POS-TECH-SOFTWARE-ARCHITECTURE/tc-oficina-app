import { Module } from "@nestjs/common";
import { ServicosPrismaGateway } from "./adapters/gateways/servicos.prisma.gateway";
import { ServicosController } from "./adapters/servicos.controller";
import { SERVICOS_GATEWAY } from "./application/ports/servicos.gateway";
import { AtualizarServicoUseCase } from "./application/use-cases/atualizar-servico.use-case";
import { BuscarServicoUseCase } from "./application/use-cases/buscar-servico.use-case";
import { CriarServicoUseCase } from "./application/use-cases/criar-servico.use-case";
import { InativarServicoUseCase } from "./application/use-cases/inativar-servico.use-case";
import { ListarServicosUseCase } from "./application/use-cases/listar-servicos.use-case";

const useCases = [
	CriarServicoUseCase,
	ListarServicosUseCase,
	BuscarServicoUseCase,
	AtualizarServicoUseCase,
	InativarServicoUseCase,
];

@Module({
	controllers: [ServicosController],
	providers: [...useCases, { provide: SERVICOS_GATEWAY, useClass: ServicosPrismaGateway }],
	exports: [SERVICOS_GATEWAY],
})
export class ServicosModule {}
