import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { AjusteInsumoDto } from "../../dto/movimento.dto";
import { INSUMOS_GATEWAY, type InsumoRegistro, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class AjustarEstoqueInsumoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(id: string, dto: AjusteInsumoDto, usuarioId: string): Promise<IServiceResponse<InsumoRegistro>> {
		const insumo = await this.gateway.buscarPorId(id);
		if (!insumo) return SR.notFound<InsumoRegistro>(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity<InsumoRegistro>(undefined, "Insumo inativado");

		if (dto.novaQuantidade < 0) return SR.badRequest<InsumoRegistro>(undefined, "Quantidade não pode ser negativa");

		const anterior = insumo.quantidadeEstoque;
		const posterior = dto.novaQuantidade;
		const delta = posterior - anterior;

		const updated = await this.gateway.registrarAjuste({
			insumoId: id,
			quantidade: Math.abs(delta),
			quantidadeAnterior: anterior,
			quantidadePosterior: posterior,
			motivo: dto.motivo,
			usuarioId,
		});

		return SR.ok(updated, "Ajuste realizado");
	}
}
