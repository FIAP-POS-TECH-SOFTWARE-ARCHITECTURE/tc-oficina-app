import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CancelarRegistroCompraDto } from "./dto/cancelar-registro-compra.dto";
import { CreateRegistroCompraDto } from "./dto/create-registro-compra.dto";
import { ReceberCompraDto } from "./dto/receber-compra.dto";
import { RegistrarRespostaFornecedorDto } from "./dto/registrar-resposta-fornecedor.dto";
import { RegistrosCompraService } from "./registros-compra.service";

@Controller("insumos/compras")
export class RegistrosCompraController {
	constructor(private readonly service: RegistrosCompraService) {}

	@Post()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	create(@Body() dto: CreateRegistroCompraDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.create(dto, user.id);
	}

	@Get()
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	list() {
		return this.service.list();
	}

	@Get(":id")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	findOne(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.findById(id);
	}

	@Post(":id/enviar-fornecedor")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	enviarFornecedor(@Param("id", ParseUUIDPipe) id: string) {
		return this.service.enviarFornecedor(id);
	}

	@Post(":id/resposta-fornecedor")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	respostaFornecedor(@Param("id", ParseUUIDPipe) id: string, @Body() dto: RegistrarRespostaFornecedorDto) {
		return this.service.registrarRespostaFornecedor(id, dto);
	}

	@Post(":id/cancelar")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarRegistroCompraDto) {
		return this.service.cancelar(id, dto);
	}

	@Post(":id/receber")
	@Roles(Role.ESTOQUISTA, Role.ADMINISTRADOR)
	receber(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ReceberCompraDto, @CurrentUser() user: AuthenticatedUser) {
		return this.service.receber(id, dto, user.id);
	}
}
