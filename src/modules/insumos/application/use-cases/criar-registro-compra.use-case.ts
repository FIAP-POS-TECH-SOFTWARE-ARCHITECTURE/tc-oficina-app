import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { CreateRegistroCompraDto } from "../../dto/create-registro-compra.dto";
import { INSUMOS_GATEWAY, type InsumosGatewayPort } from "../ports/insumos.gateway";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class CriarRegistroCompraUseCase {
	constructor(
		@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort,
		@Inject(INSUMOS_GATEWAY) private readonly insumos: InsumosGatewayPort,
	) {}

	async execute(dto: CreateRegistroCompraDto, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const insumo = await this.insumos.buscarPorId(dto.insumoId);
		if (!insumo) return SR.notFound(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity(undefined, "Insumo inativado");

		if (dto.ordemServicoId) {
			const existe = await this.gateway.ordemServicoExiste(dto.ordemServicoId);
			if (!existe) return SR.notFound(undefined, "OS não encontrada para vincular o registro de compra");
		}

		const created = await this.gateway.criar({
			insumoId: dto.insumoId,
			quantidadeSolicitada: dto.quantidadeSolicitada,
			solicitadoPorId: usuarioId,
			ordemServicoId: dto.ordemServicoId,
		});

		const detalhe = await this.gateway.buscarDetalhePorId(created.id);
		return SR.created(detalhe, "Registro de compra criado");
	}
}
