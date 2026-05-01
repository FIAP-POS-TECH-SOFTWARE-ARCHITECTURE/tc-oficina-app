import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateUsuarioDto } from "./dto/create-usuario.dto";
import { UpdateSenhaDto } from "./dto/update-senha.dto";
import { UpdateUsuarioDto } from "./dto/update-usuario.dto";
import { UsuariosService } from "./usuarios.service";

@Controller("usuarios")
export class UsuariosController {
	constructor(private readonly service: UsuariosService) {}

	@Post()
	@Roles(Role.ADMINISTRADOR)
	create(@Body() dto: CreateUsuarioDto) {
		return this.service.create(dto);
	}

	@Get()
	@Roles(Role.ADMINISTRADOR)
	findAll() {
		return this.service.findAll();
	}

	@Get(":id")
	@Roles(Role.ADMINISTRADOR)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ADMINISTRADOR)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUsuarioDto) {
		return this.service.update(id, dto);
	}

	@Patch(":id/senha")
	updateSenha(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSenhaDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.updateSenha(id, dto, { id: user.id, role: user.role });
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
