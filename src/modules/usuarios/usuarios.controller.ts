import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateUsuarioDto } from "./dto/create-usuario.dto";
import { UpdateSenhaDto } from "./dto/update-senha.dto";
import { UpdateUsuarioDto } from "./dto/update-usuario.dto";
import { UsuariosService } from "./usuarios.service";
import { UsuarioResponseDto } from "./dto/usuario-response.dto";

@ApiTags("Usuários")
@ApiBearerAuth()
@Controller("usuarios")
export class UsuariosController {
	constructor(private readonly service: UsuariosService) {}

	@Post()
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Criar novo usuário (Somente Admin)" })
	@ApiEnvelopedResponse(UsuarioResponseDto, { status: 201 })
	create(@Body() dto: CreateUsuarioDto) {
		return this.service.create(dto);
	}

	@Get()
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Listar todos os usuários (Somente Admin)" })
	@ApiEnvelopedResponse(UsuarioResponseDto, { isArray: true })
	findAll() {
		return this.service.findAll();
	}

	@Get(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Buscar usuário por ID (Somente Admin)" })
	@ApiEnvelopedResponse(UsuarioResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do usuário (Somente Admin)" })
	@ApiEnvelopedResponse(UsuarioResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUsuarioDto) {
		return this.service.update(id, dto);
	}

	@Patch(":id/senha")
	@ApiOperation({ summary: "Atualizar própria senha ou qualquer senha (se Admin)" })
	@ApiEnvelopedResponse(UsuarioResponseDto)
	updateSenha(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSenhaDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.updateSenha(id, dto, { id: user.id, role: user.role });
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover usuário (Somente Admin)" })
	@ApiEnvelopedResponse(UsuarioResponseDto)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
