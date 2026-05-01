import { Injectable } from "@nestjs/common";
import { Insumo, MovimentoEstoque, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class InsumosRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: Prisma.InsumoCreateInput): Promise<Insumo> {
		return this.prisma.insumo.create({ data });
	}

	findById(id: string): Promise<Insumo | null> {
		return this.prisma.insumo.findUnique({ where: { id } });
	}

	findByCodigo(codigo: string): Promise<Insumo | null> {
		return this.prisma.insumo.findUnique({ where: { codigo } });
	}

	findAll(): Promise<Insumo[]> {
		return this.prisma.insumo.findMany({ orderBy: { nome: "asc" } });
	}

	update(id: string, data: Prisma.InsumoUpdateInput): Promise<Insumo> {
		return this.prisma.insumo.update({ where: { id }, data });
	}

	softDelete(id: string): Promise<Insumo> {
		return this.prisma.insumo.update({ where: { id }, data: { ativo: false } });
	}

	findEstoqueBaixo(): Promise<Insumo[]> {
		return this.prisma.insumo.findMany({
			where: {
				ativo: true,
				quantidadeEstoque: { lte: this.prisma.insumo.fields.estoqueMinimo },
			},
			orderBy: { nome: "asc" },
		});
	}

	listarMovimentos(insumoId: string): Promise<MovimentoEstoque[]> {
		return this.prisma.movimentoEstoque.findMany({
			where: { insumoId },
			orderBy: { createdAt: "desc" },
		});
	}
}
