import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { OsStatus } from "../../domain/os-status";
import { SERVICOS_CONSULTA, type ServicosConsultaPort } from "../ports/consultas-externas.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class AddItemServicoUseCase {
	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(SERVICOS_CONSULTA) private readonly servicos: ServicosConsultaPort,
	) {}

	async execute(id: string, dto: { servicoId: string; quantidade?: number }): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorId(id);
		if (!os) return SR.notFound(undefined, "OS não encontrada");
		if (os.status !== OsStatus.RECEBIDA && os.status !== OsStatus.EM_DIAGNOSTICO)
			return SR.unprocessableEntity(undefined, "Itens só podem ser adicionados antes da geração do orçamento");

		const servico = await this.servicos.buscarPorId(dto.servicoId);
		if (!servico) return SR.notFound(undefined, "Serviço não encontrado");
		if (servico.ativo === false) return SR.unprocessableEntity(undefined, "Serviço inativado");

		const quantidade = dto.quantidade ?? 1;
		await this.gateway.criarItemServico({
			ordemServicoId: id,
			servicoId: servico.id,
			precoUnitario: servico.preco,
			quantidade,
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.created(detalhe, "Item de serviço adicionado");
	}
}
