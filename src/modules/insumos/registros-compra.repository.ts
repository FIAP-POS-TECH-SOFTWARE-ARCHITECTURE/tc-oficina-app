import { Injectable } from "@nestjs/common";
import { Prisma, RegistroCompra } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const REGISTRO_COMPRA_INCLUDE = {
	insumo: true,
	ordemServico: true,
	solicitadoPor: true,
	recebidoPor: true,
} satisfies Prisma.RegistroCompraInclude;

@Injectable()
export class RegistrosCompraRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: Prisma.RegistroCompraCreateInput): Promise<RegistroCompra> {
		return this.prisma.registroCompra.create({ data });
	}

	findById(id: string): Promise<RegistroCompra | null> {
		return this.prisma.registroCompra.findUnique({ where: { id } });
	}

	findByIdFull(id: string) {
		return this.prisma.registroCompra.findUnique({
			where: { id },
			include: REGISTRO_COMPRA_INCLUDE,
		});
	}

	findAll() {
		return this.prisma.registroCompra.findMany({
			orderBy: { createdAt: "desc" },
			include: REGISTRO_COMPRA_INCLUDE,
		});
	}

	update(id: string, data: Prisma.RegistroCompraUpdateInput): Promise<RegistroCompra> {
		return this.prisma.registroCompra.update({ where: { id }, data });
	}
}
