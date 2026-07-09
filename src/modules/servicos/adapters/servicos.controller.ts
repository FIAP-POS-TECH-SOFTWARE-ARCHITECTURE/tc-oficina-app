import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { AtualizarServicoUseCase } from "../application/use-cases/atualizar-servico.use-case";
import { BuscarServicoUseCase } from "../application/use-cases/buscar-servico.use-case";
import { CriarServicoUseCase } from "../application/use-cases/criar-servico.use-case";
import { InativarServicoUseCase } from "../application/use-cases/inativar-servico.use-case";
import { ListarServicosUseCase } from "../application/use-cases/listar-servicos.use-case";
import { CreateServicoDto } from "../dto/create-servico.dto";
import { ServicoResponseDto } from "../dto/servico-response.dto";
import { UpdateServicoDto } from "../dto/update-servico.dto";

@ApiTags("Serviços (Catálogo)")
@ApiBearerAuth()
@Controller("servicos")
export class ServicosController {
	constructor(
		private readonly criarServico: CriarServicoUseCase,
		private readonly listarServicos: ListarServicosUseCase,
		private readonly buscarServico: BuscarServicoUseCase,
		private readonly atualizarServico: AtualizarServicoUseCase,
		private readonly inativarServico: InativarServicoUseCase,
	) {}

	@Post()
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Cadastrar novo serviço no catálogo" })
	@ApiEnvelopedResponse(ServicoResponseDto, { status: 201 })
	create(@Body() dto: CreateServicoDto) {
		return this.criarServico.execute(dto);
	}

	@Get()
	@ApiOperation({ summary: "Listar todos os serviços disponíveis" })
	@ApiEnvelopedResponse(ServicoResponseDto, { isArray: true })
	findAll() {
		return this.listarServicos.execute();
	}

	@Get(":id")
	@ApiOperation({ summary: "Buscar serviço por ID" })
	@ApiEnvelopedResponse(ServicoResponseDto)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.buscarServico.execute(id);
	}

	@Patch(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Atualizar dados do serviço" })
	@ApiEnvelopedResponse(ServicoResponseDto)
	update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateServicoDto) {
		return this.atualizarServico.execute(id, dto);
	}

	@Delete(":id")
	@Roles(Role.ADMINISTRADOR)
	@ApiOperation({ summary: "Remover serviço do catálogo" })
	@ApiEnvelopedResponse(ServicoResponseDto)
	remove(@Param("id", ParseUUIDPipe) id: string) {
		return this.inativarServico.execute(id);
	}
}
