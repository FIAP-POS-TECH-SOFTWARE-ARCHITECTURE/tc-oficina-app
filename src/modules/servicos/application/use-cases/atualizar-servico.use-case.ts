import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { UpdateServicoDto } from "../../dto/update-servico.dto";
import { SERVICOS_GATEWAY, type ServicoRegistro, type ServicosGatewayPort } from "../ports/servicos.gateway";

@Injectable()
export class AtualizarServicoUseCase {
	constructor(@Inject(SERVICOS_GATEWAY) private readonly gateway: ServicosGatewayPort) {}

	async execute(id: string, dto: UpdateServicoDto): Promise<IServiceResponse<ServicoRegistro>> {
		const servico = await this.gateway.buscarPorId(id);
		if (!servico) return SR.notFound<ServicoRegistro>(undefined, "Serviço não encontrado");
		if (servico.ativo === false) return SR.unprocessableEntity<ServicoRegistro>(undefined, "Serviço inativado");

		if (dto.nome && dto.nome !== servico.nome) {
			const conflict = await this.gateway.buscarPorNome(dto.nome);
			if (conflict) return SR.conflict<ServicoRegistro>(undefined, "Já existe serviço com esse nome");
		}

		const updated = await this.gateway.atualizar(id, dto);
		return SR.ok(updated, "Serviço atualizado");
	}
}
