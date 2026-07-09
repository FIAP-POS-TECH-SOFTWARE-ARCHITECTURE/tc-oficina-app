import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { ReceberCompraDto } from "../../dto/receber-compra.dto";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class ReceberCompraUseCase {
	constructor(@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort) {}

	async execute(id: string, dto: ReceberCompraDto, usuarioId: string): Promise<IServiceResponse<unknown>> {
		const registro = await this.gateway.buscarPorId(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status !== "APROVADO_FORNECEDOR")
			return SR.unprocessableEntity(undefined, `Só é possível receber compra aprovada. Status atual: ${registro.status}`);

		await this.gateway.receberComEntradaEstoque({
			registroId: registro.id,
			insumoId: registro.insumoId,
			quantidade: registro.quantidadeSolicitada,
			usuarioId,
			motivo: `Entrada por recebimento da compra ${registro.id} (NF ${dto.notaFiscalNumero})`,
			notaFiscal: {
				numero: dto.notaFiscalNumero,
				chave: dto.notaFiscalChave,
				arquivoNome: dto.arquivoNome,
				arquivoTipo: dto.arquivoTipo,
				arquivoTamanho: dto.arquivoTamanho,
				arquivoUrl: dto.arquivoUrl,
			},
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Compra recebida e entrada de estoque registrada");
	}
}
