import { Injectable } from "@nestjs/common";
import { Cliente, TipoDocumentoCliente } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { ClientesGatewayPort } from "../../application/ports/clientes.gateway";

@Injectable()
export class ClientesPrismaGateway implements ClientesGatewayPort {
	constructor(private readonly prisma: PrismaService) {}

	criar(dados: {
		nome: string;
		documento: string;
		tipoDocumento: "CPF" | "CNPJ";
		email?: string;
		telefone?: string;
		endereco?: string;
	}): Promise<Cliente> {
		return this.prisma.cliente.create({
			data: { ...dados, tipoDocumento: TipoDocumentoCliente[dados.tipoDocumento] },
		});
	}

	listarTodos(): Promise<Cliente[]> {
		return this.prisma.cliente.findMany({ orderBy: { createdAt: "desc" } });
	}

	buscarPorId(id: string): Promise<Cliente | null> {
		return this.prisma.cliente.findUnique({ where: { id } });
	}

	buscarPorDocumento(documento: string): Promise<Cliente | null> {
		return this.prisma.cliente.findUnique({ where: { documento } });
	}

	atualizar(
		id: string,
		dados: Partial<{ nome: string; email: string; telefone: string; endereco: string; ativo: boolean }>,
	): Promise<Cliente> {
		return this.prisma.cliente.update({ where: { id }, data: dados });
	}

	inativar(id: string): Promise<Cliente> {
		return this.prisma.cliente.update({ where: { id }, data: { ativo: false } });
	}

	contarOrdensAbertas(clienteId: string): Promise<number> {
		return this.prisma.ordemServico.count({
			where: {
				clienteId,
				status: { notIn: ["ENTREGUE", "CANCELADA"] },
			},
		});
	}
}
