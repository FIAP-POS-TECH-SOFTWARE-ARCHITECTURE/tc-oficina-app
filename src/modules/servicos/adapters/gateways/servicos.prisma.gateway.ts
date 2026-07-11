import { Injectable } from "@nestjs/common";
import { Servico } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { ServicosGatewayPort } from "../../application/ports/servicos.gateway";

@Injectable()
export class ServicosPrismaGateway implements ServicosGatewayPort {
	constructor(private readonly prisma: PrismaService) {}

	criar(dados: { nome: string; descricao?: string; preco: number; tempoEstimadoMin: number }): Promise<Servico> {
		return this.prisma.servico.create({ data: dados });
	}

	listarTodos(): Promise<Servico[]> {
		return this.prisma.servico.findMany({ orderBy: { nome: "asc" } });
	}

	buscarPorId(id: string): Promise<Servico | null> {
		return this.prisma.servico.findUnique({ where: { id } });
	}

	buscarPorNome(nome: string): Promise<Servico | null> {
		return this.prisma.servico.findUnique({ where: { nome } });
	}

	atualizar(
		id: string,
		dados: Partial<{ nome: string; descricao: string; preco: number; tempoEstimadoMin: number; ativo: boolean }>,
	): Promise<Servico> {
		return this.prisma.servico.update({ where: { id }, data: dados });
	}

	inativar(id: string): Promise<Servico> {
		return this.prisma.servico.update({ where: { id }, data: { ativo: false } });
	}
}
