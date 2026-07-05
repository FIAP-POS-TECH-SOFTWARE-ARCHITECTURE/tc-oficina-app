import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { OsStatus } from "../../domain/os-status";
import { INSUMOS_CONSULTA, type InsumosConsultaPort } from "../ports/consultas-externas.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class AddItemInsumoUseCase {
	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(INSUMOS_CONSULTA) private readonly insumos: InsumosConsultaPort,
	) {}

	async execute(id: string, dto: { insumoId: string; quantidade: number }): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser adicionados antes da geração do orçamento");

		const insumo = await this.insumos.buscarPorId(dto.insumoId);
		if (!insumo) return SR.notFound(undefined, "Insumo não encontrado");
		if (insumo.ativo === false) return SR.unprocessableEntity(undefined, "Insumo inativado");
		if (insumo.quantidadeEstoque < dto.quantidade)
			return SR.unprocessableEntity(undefined, `Estoque insuficiente. Disponível: ${insumo.quantidadeEstoque}`);

		await this.gateway.criarItemInsumo({
			ordemServicoId: id,
			insumoId: insumo.id,
			precoUnitario: insumo.precoUnitario,
			quantidade: dto.quantidade,
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.created(detalhe, "Insumo adicionado");
	}
}
