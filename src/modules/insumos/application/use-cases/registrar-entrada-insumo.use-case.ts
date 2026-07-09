import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { EntradaInsumoDto } from "../../dto/movimento.dto";
import { INSUMOS_GATEWAY, type InsumoRegistro, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class RegistrarEntradaInsumoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(id: string, dto: EntradaInsumoDto, usuarioId: string): Promise<IServiceResponse<InsumoRegistro>> {
		const insumo = await this.gateway.buscarPorId(id);
		if (!insumo) return SR.notFound<InsumoRegistro>(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity<InsumoRegistro>(undefined, "Insumo inativado");

		const anterior = insumo.quantidadeEstoque;
		const posterior = anterior + dto.quantidade;

		const updated = await this.gateway.registrarEntrada({
			insumoId: id,
			quantidade: dto.quantidade,
			quantidadeAnterior: anterior,
			quantidadePosterior: posterior,
			motivo: dto.motivo,
			usuarioId,
		});

		return SR.ok(updated, "Entrada registrada");
	}
}
