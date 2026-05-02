import { Injectable } from "@nestjs/common";
import { OrdemServico, OsStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const OS_INCLUDE = {
	cliente: true,
	veiculo: true,
	itensServico: { include: { servico: true } },
	itensInsumo: { include: { insumo: true } },
	historico: { orderBy: { createdAt: "asc" } as const },
} satisfies Prisma.OrdemServicoInclude;

@Injectable()
export class OrdensServicoRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: { numero: string; clienteId: string; veiculoId: string }): Promise<OrdemServico> {
		return this.prisma.ordemServico.create({ data });
	}

	findByIdFull(id: string) {
		return this.prisma.ordemServico.findUnique({
			where: { id },
			include: OS_INCLUDE,
		});
	}

	findByNumero(numero: string) {
		return this.prisma.ordemServico.findUnique({
			where: { numero },
			include: OS_INCLUDE,
		});
	}

	findById(id: string): Promise<OrdemServico | null> {
		return this.prisma.ordemServico.findUnique({ where: { id } });
	}

	list(params: { status?: OsStatus; clienteId?: string; skip: number; take: number }) {
		const where: Prisma.OrdemServicoWhereInput = {};
		if (params.status) where.status = params.status;
		if (params.clienteId) where.clienteId = params.clienteId;
		return this.prisma.$transaction([
			this.prisma.ordemServico.count({ where }),
			this.prisma.ordemServico.findMany({
				where,
				skip: params.skip,
				take: params.take,
				orderBy: { createdAt: "desc" },
				include: OS_INCLUDE,
			}),
		]);
	}

	tempoMedioPorMes() {
		return this.prisma.$queryRaw<{ ano_mes: string; tempo_medio_min: number; total: number }[]>`
			SELECT
				to_char(ois.finalizado_execucao_em, 'YYYY-MM') AS ano_mes,
				AVG(EXTRACT(EPOCH FROM (ois.finalizado_execucao_em - ois.iniciado_execucao_em)) / 60)::float AS tempo_medio_min,
				COUNT(ois.id)::int AS total
			FROM os_itens_servico ois
			INNER JOIN ordens_servico os ON os.id = ois.ordem_servico_id
			WHERE ois.status = 'CONCLUIDO'
				AND ois.finalizado_execucao_em IS NOT NULL
				AND ois.iniciado_execucao_em IS NOT NULL
			GROUP BY ano_mes
			ORDER BY ano_mes DESC
		`;
	}

	contadorAno(ano: number): Promise<number> {
		return this.prisma.ordemServico.count({
			where: {
				createdAt: {
					gte: new Date(`${ano}-01-01T00:00:00Z`),
					lt: new Date(`${ano + 1}-01-01T00:00:00Z`),
				},
			},
		});
	}

	findHistorico(ordemServicoId: string) {
		return this.prisma.osHistoricoStatus.findMany({
			where: { ordemServicoId },
			include: { usuario: true },
			orderBy: { createdAt: "asc" },
		});
	}
}

export { OS_INCLUDE };
