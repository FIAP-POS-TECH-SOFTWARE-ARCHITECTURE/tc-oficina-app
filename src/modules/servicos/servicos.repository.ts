import { Injectable } from "@nestjs/common";
import { Prisma, Servico } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ServicosRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: Prisma.ServicoCreateInput): Promise<Servico> {
		return this.prisma.servico.create({ data });
	}

	findById(id: string): Promise<Servico | null> {
		return this.prisma.servico.findUnique({ where: { id } });
	}

	findByNome(nome: string): Promise<Servico | null> {
		return this.prisma.servico.findUnique({ where: { nome } });
	}

	findAll(): Promise<Servico[]> {
		return this.prisma.servico.findMany({ orderBy: { nome: "asc" } });
	}

	update(id: string, data: Prisma.ServicoUpdateInput): Promise<Servico> {
		return this.prisma.servico.update({ where: { id }, data });
	}

	softDelete(id: string): Promise<Servico> {
		return this.prisma.servico.update({ where: { id }, data: { ativo: false } });
	}
}
