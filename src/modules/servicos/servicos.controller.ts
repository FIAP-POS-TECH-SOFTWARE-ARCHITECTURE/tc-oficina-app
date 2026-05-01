import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateServicoDto } from "./dto/create-servico.dto";
import { UpdateServicoDto } from "./dto/update-servico.dto";
import { ServicosService } from "./servicos.service";

@Controller("servicos")
export class ServicosController {
	constructor(private readonly service: ServicosService) {}

	@Post()
	@Roles(Role.ADMINISTRADOR)
	create(@Body() dto: CreateServicoDto) {
		return this.service.create(dto);
	}

	@Get()
	findAll() {
		return this.service.findAll();
	}

	@Get(":id")
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ADMINISTRADOR)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateServicoDto) {
		return this.service.update(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
