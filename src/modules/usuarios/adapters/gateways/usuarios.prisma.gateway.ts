import { Injectable } from "@nestjs/common";
import { Role, Usuario } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { UsuariosGatewayPort } from "../../application/ports/usuarios.gateway";

@Injectable()
export class UsuariosPrismaGateway implements UsuariosGatewayPort {
	constructor(private readonly prisma: PrismaService) {}

	criar(dados: { nome: string; email: string; senhaHash: string; role: Role }): Promise<Usuario> {
		return this.prisma.usuario.create({ data: dados });
	}

	listarTodos(): Promise<Usuario[]> {
		return this.prisma.usuario.findMany({ orderBy: { createdAt: "desc" } });
	}

	buscarPorId(id: string): Promise<Usuario | null> {
		return this.prisma.usuario.findUnique({ where: { id } });
	}

	buscarPorEmail(email: string): Promise<Usuario | null> {
		return this.prisma.usuario.findUnique({ where: { email } });
	}

	atualizar(
		id: string,
		dados: Partial<{ nome: string; email: string; role: Role; ativo: boolean; senhaHash: string }>,
	): Promise<Usuario> {
		return this.prisma.usuario.update({ where: { id }, data: dados });
	}

	inativar(id: string): Promise<Usuario> {
		return this.prisma.usuario.update({ where: { id }, data: { ativo: false } });
	}

	contarAdminsAtivos(): Promise<number> {
		return this.prisma.usuario.count({ where: { role: Role.ADMINISTRADOR, ativo: true } });
	}
}
