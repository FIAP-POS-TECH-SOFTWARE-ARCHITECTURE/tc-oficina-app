import { Module } from "@nestjs/common";
import { ClientesModule } from "../clientes/clientes.module";
import { VeiculosPrismaGateway } from "./adapters/gateways/veiculos.prisma.gateway";
import { VeiculosController } from "./adapters/veiculos.controller";
import { VEICULOS_GATEWAY } from "./application/ports/veiculos.gateway";
import { AtualizarVeiculoUseCase } from "./application/use-cases/atualizar-veiculo.use-case";
import { BuscarVeiculoPorPlacaUseCase } from "./application/use-cases/buscar-veiculo-por-placa.use-case";
import { BuscarVeiculoUseCase } from "./application/use-cases/buscar-veiculo.use-case";
import { CriarVeiculoUseCase } from "./application/use-cases/criar-veiculo.use-case";
import { InativarVeiculoUseCase } from "./application/use-cases/inativar-veiculo.use-case";
import { ListarVeiculosDoClienteUseCase } from "./application/use-cases/listar-veiculos-do-cliente.use-case";

const useCases = [
	CriarVeiculoUseCase,
	ListarVeiculosDoClienteUseCase,
	BuscarVeiculoUseCase,
	BuscarVeiculoPorPlacaUseCase,
	AtualizarVeiculoUseCase,
	InativarVeiculoUseCase,
];

@Module({
	imports: [ClientesModule],
	controllers: [VeiculosController],
	providers: [...useCases, { provide: VEICULOS_GATEWAY, useClass: VeiculosPrismaGateway }],
	exports: [VEICULOS_GATEWAY],
})
export class VeiculosModule {}
