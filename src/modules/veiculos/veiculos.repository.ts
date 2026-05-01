import { Injectable } from "@nestjs/common";
import { Prisma, Veiculo } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VeiculosRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: { placa: string; marca: string; modelo: string; ano: number; clienteId: string }): Promise<Veiculo> {
		return this.prisma.veiculo.create({ data });
	}

	findById(id: string): Promise<Veiculo | null> {
		return this.prisma.veiculo.findUnique({ where: { id } });
	}

	findByPlaca(placa: string): Promise<Veiculo | null> {
		return this.prisma.veiculo.findUnique({ where: { placa } });
	}

	findByCliente(clienteId: string): Promise<Veiculo[]> {
		return this.prisma.veiculo.findMany({
			where: { clienteId },
			orderBy: { createdAt: "desc" },
		});
	}

	update(id: string, data: Prisma.VeiculoUpdateInput): Promise<Veiculo> {
		return this.prisma.veiculo.update({ where: { id }, data });
	}

	softDelete(id: string): Promise<Veiculo> {
		return this.prisma.veiculo.update({ where: { id }, data: { ativo: false } });
	}

	hasOrdensAbertas(veiculoId: string): Promise<number> {
		return this.prisma.ordemServico.count({
			where: {
				veiculoId,
				status: { notIn: ["ENTREGUE", "CANCELADA"] },
			},
		});
	}
}
