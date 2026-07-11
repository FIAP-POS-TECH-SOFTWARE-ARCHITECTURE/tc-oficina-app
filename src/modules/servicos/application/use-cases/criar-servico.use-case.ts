import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { Servico } from "../../domain/servico.entity";
import { CreateServicoDto } from "../../dto/create-servico.dto";
import { SERVICOS_GATEWAY, type ServicoRegistro, type ServicosGatewayPort } from "../ports/servicos.gateway";

@Injectable()
export class CriarServicoUseCase {
	constructor(@Inject(SERVICOS_GATEWAY) private readonly gateway: ServicosGatewayPort) {}

	async execute(dto: CreateServicoDto): Promise<IServiceResponse<ServicoRegistro>> {
		const exists = await this.gateway.buscarPorNome(dto.nome);
		if (exists) return SR.conflict<ServicoRegistro>(undefined, "Já existe serviço com esse nome");

		const servico = Servico.criar({
			nome: dto.nome,
			descricao: dto.descricao ?? null,
			preco: dto.preco,
			tempoEstimadoMin: dto.tempoEstimadoMin,
		});

		const created = await this.gateway.criar({
			nome: servico.nome,
			descricao: dto.descricao,
			preco: servico.preco,
			tempoEstimadoMin: servico.tempoEstimadoMin,
		});

		return SR.created(created, "Serviço cadastrado");
	}
}
