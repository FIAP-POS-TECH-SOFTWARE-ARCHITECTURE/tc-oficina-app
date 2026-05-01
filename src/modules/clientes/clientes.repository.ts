import { Injectable } from "@nestjs/common";
import { Cliente, Prisma, TipoDocumentoCliente } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClientesRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: {
		nome: string;
		documento: string;
		tipoDocumento: TipoDocumentoCliente;
		email?: string;
		telefone?: string;
		endereco?: string;
	}): Promise<Cliente> {
		return this.prisma.cliente.create({ data });
	}

	findById(id: string): Promise<Cliente | null> {
		return this.prisma.cliente.findUnique({ where: { id } });
	}

	findByDocumento(documento: string): Promise<Cliente | null> {
		return this.prisma.cliente.findUnique({ where: { documento } });
	}

	findAll(): Promise<Cliente[]> {
		return this.prisma.cliente.findMany({ orderBy: { createdAt: "desc" } });
	}

	update(id: string, data: Prisma.ClienteUpdateInput): Promise<Cliente> {
		return this.prisma.cliente.update({ where: { id }, data });
	}

	softDelete(id: string): Promise<Cliente> {
		return this.prisma.cliente.update({ where: { id }, data: { ativo: false } });
	}

	hasOrdensAbertas(clienteId: string): Promise<number> {
		return this.prisma.ordemServico.count({
			where: {
				clienteId,
				status: { notIn: ["ENTREGUE", "CANCELADA"] },
			},
		});
	}
}
