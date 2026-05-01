import { Injectable } from "@nestjs/common";
import { Prisma, Role, Usuario } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsuariosRepository {
	constructor(private readonly prisma: PrismaService) {}

	create(data: { nome: string; email: string; senhaHash: string; role: Role }): Promise<Usuario> {
		return this.prisma.usuario.create({ data });
	}

	findById(id: string): Promise<Usuario | null> {
		return this.prisma.usuario.findUnique({ where: { id } });
	}

	findByEmail(email: string): Promise<Usuario | null> {
		return this.prisma.usuario.findUnique({ where: { email } });
	}

	findAll(): Promise<Usuario[]> {
		return this.prisma.usuario.findMany({ orderBy: { createdAt: "desc" } });
	}

	update(id: string, data: Prisma.UsuarioUpdateInput): Promise<Usuario> {
		return this.prisma.usuario.update({ where: { id }, data });
	}

	softDelete(id: string): Promise<Usuario> {
		return this.prisma.usuario.update({ where: { id }, data: { ativo: false } });
	}

	countAdmins(): Promise<number> {
		return this.prisma.usuario.count({ where: { role: Role.ADMINISTRADOR, ativo: true } });
	}
}
