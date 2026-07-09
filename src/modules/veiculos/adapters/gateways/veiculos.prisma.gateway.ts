import { Injectable } from "@nestjs/common";
import { Veiculo } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { VeiculosGatewayPort } from "../../application/ports/veiculos.gateway";

@Injectable()
export class VeiculosPrismaGateway implements VeiculosGatewayPort {
	constructor(private readonly prisma: PrismaService) {}

	criar(dados: { placa: string; marca: string; modelo: string; ano: number; clienteId: string }): Promise<Veiculo> {
		return this.prisma.veiculo.create({ data: dados });
	}

	listarPorCliente(clienteId: string): Promise<Veiculo[]> {
		return this.prisma.veiculo.findMany({
			where: { clienteId },
			orderBy: { createdAt: "desc" },
		});
	}

	buscarPorId(id: string): Promise<Veiculo | null> {
		return this.prisma.veiculo.findUnique({ where: { id } });
	}

	buscarPorPlaca(placa: string): Promise<Veiculo | null> {
		return this.prisma.veiculo.findUnique({ where: { placa } });
	}

	atualizar(id: string, dados: Partial<{ marca: string; modelo: string; ano: number; ativo: boolean }>): Promise<Veiculo> {
		return this.prisma.veiculo.update({ where: { id }, data: dados });
	}

	inativar(id: string): Promise<Veiculo> {
		return this.prisma.veiculo.update({ where: { id }, data: { ativo: false } });
	}

	contarOrdensAbertas(veiculoId: string): Promise<number> {
		return this.prisma.ordemServico.count({
			where: {
				veiculoId,
				status: { notIn: ["ENTREGUE", "CANCELADA"] },
			},
		});
	}
}
