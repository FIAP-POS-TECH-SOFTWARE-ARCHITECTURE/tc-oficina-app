import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { gerarNumeroOs } from "../../domain/numero-os";
import { OrdemServico } from "../../domain/ordem-servico.entity";
import {
	CLIENTES_CONSULTA,
	type ClientesConsultaPort,
	VEICULOS_CONSULTA,
	type VeiculosConsultaPort,
} from "../ports/consultas-externas.gateway";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class CriarOsUseCase {
	constructor(
		@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort,
		@Inject(CLIENTES_CONSULTA) private readonly clientes: ClientesConsultaPort,
		@Inject(VEICULOS_CONSULTA) private readonly veiculos: VeiculosConsultaPort,
	) {}

	async execute(dto: { clienteId: string; veiculoId: string }): Promise<IServiceResponse<unknown>> {
		const cliente = await this.clientes.buscarPorId(dto.clienteId);
		if (!cliente) return SR.notFound(undefined, "Cliente não encontrado");
		if (cliente.ativo === false) return SR.unprocessableEntity(undefined, "Cliente inativado");

		const veiculo = await this.veiculos.buscarPorId(dto.veiculoId);
		if (!veiculo) return SR.notFound(undefined, "Veículo não encontrado");
		if (veiculo.ativo === false) return SR.unprocessableEntity(undefined, "Veículo inativado");
		if (veiculo.clienteId !== dto.clienteId) return SR.badRequest(undefined, "Veículo não pertence ao cliente informado");

		const ano = new Date().getUTCFullYear();
		const numero = gerarNumeroOs(ano, (await this.gateway.contarPorAno(ano)) + 1);
		const os = OrdemServico.criar({ numero, clienteId: dto.clienteId, veiculoId: dto.veiculoId });

		const created = await this.gateway.criarComHistorico({
			numero: os.numero,
			clienteId: os.clienteId,
			veiculoId: os.veiculoId,
		});
		const detalhe = await this.gateway.buscarDetalhePorId(created.id);
		return SR.created(detalhe, "OS criada");
	}
}
