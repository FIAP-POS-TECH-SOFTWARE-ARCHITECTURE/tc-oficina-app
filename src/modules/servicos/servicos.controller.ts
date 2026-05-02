import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CreateServicoDto } from "./dto/create-servico.dto";
import { UpdateServicoDto } from "./dto/update-servico.dto";
import { ServicosService } from "./servicos.service";
import { ServicoResponseDto } from "./dto/servico-response.dto";

@ApiTags("Serviços (Catálogo)")
@ApiBearerAuth()
@Controller("servicos")
export class ServicosController {
	constructor(private readonly service: ServicosService) {}

	@Post()
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar novo serviço no catálogo" })
	@ApiEnvelopedResponse(ServicoResponseDto, { status: 201 })
	create(@Body() dto: CreateServicoDto) {
		return this.service.create(dto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todos os serviços disponíveis" })
	@ApiEnvelopedResponse(ServicoResponseDto, { isArray: true })
	findAll() {
		return this.service.findAll();
	}

	@Get(":id")
	@ApiOperation({ summary: "Buscar serviço por ID" })
	@ApiEnvelopedResponse(ServicoResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Patch(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do serviço" })
	@ApiEnvelopedResponse(ServicoResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateServicoDto) {
		return this.service.update(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover serviço do catálogo" })
	@ApiEnvelopedResponse(ServicoResponseDto)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.remove(id);
	}
}
