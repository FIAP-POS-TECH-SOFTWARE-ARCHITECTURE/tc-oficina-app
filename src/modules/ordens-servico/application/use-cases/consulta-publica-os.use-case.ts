import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../../../common/validators/cpf-cnpj.validator";
import { ORDENS_SERVICO_GATEWAY, type OrdensServicoGatewayPort } from "../ports/ordens-servico.gateway";

@Injectable()
export class ConsultaPublicaOsUseCase {
	constructor(@Inject(ORDENS_SERVICO_GATEWAY) private readonly gateway: OrdensServicoGatewayPort) {}

	async execute(numero: string, documento: string): Promise<IServiceResponse<unknown>> {
		const os = await this.gateway.buscarPorNumero(numero);
		if (!os) return SR.notFound(undefined, "OS não encontrada");

		if (normalizeCpfOrCnpj(documento) !== os.cliente.documento)
			return SR.forbidden(undefined, "Documento não confere com o cliente da OS");

		const nomeMascarado = this.mascararNome(os.cliente.nome);

		return SR.ok({
			numero: os.numero,
			cliente: nomeMascarado,
			veiculo: { placa: os.veiculo.placa, marca: os.veiculo.marca, modelo: os.veiculo.modelo },
			status: os.status,
			diagnostico: os.diagnostico,
			valorTotal: os.valorTotal,
			itensServico: os.itensServico.map((i) => ({
				nome: i.servico.nome,
				status: i.status,
				iniciadoExecucaoEm: i.iniciadoExecucaoEm,
				finalizadoExecucaoEm: i.finalizadoExecucaoEm,
				quantidade: i.quantidade,
				precoUnitario: i.precoUnitario,
				subtotal: i.subtotal,
			})),
			itensInsumo: os.itensInsumo.map((i) => ({
				nome: i.insumo.nome,
				quantidade: i.quantidade,
				precoUnitario: i.precoUnitario,
				subtotal: i.subtotal,
			})),
			historico: os.historico.map((h) => ({
				statusAnterior: h.statusAnterior,
				statusNovo: h.statusNovo,
				observacao: h.observacao,
				em: h.createdAt,
			})),
		});
	}

	private mascararNome(nome: string): string {
		const partes = nome.trim().split(/\s+/);
		if (partes.length === 1) {
			const unico = partes[0];
			return unico[0] + "*".repeat(Math.max(unico.length - 1, 1));
		}

		return partes
			.map((p, i) => {
				if (i === 0) return p;
				if (partes.length > 2 && i === partes.length - 1) return p;
				return p[0] + "*".repeat(Math.max(p.length - 1, 1));
			})
			.join(" ");
	}
}
