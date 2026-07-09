import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { RegistrarRespostaFornecedorDto } from "../../dto/registrar-resposta-fornecedor.dto";
import { REGISTROS_COMPRA_GATEWAY, type RegistrosCompraGatewayPort } from "../ports/registros-compra.gateway";

@Injectable()
export class RegistrarRespostaFornecedorUseCase {
	constructor(@Inject(REGISTROS_COMPRA_GATEWAY) private readonly gateway: RegistrosCompraGatewayPort) {}

	async execute(id: string, dto: RegistrarRespostaFornecedorDto): Promise<IServiceResponse<unknown>> {
		const registro = await this.gateway.buscarPorId(id);
		if (!registro) return SR.notFound(undefined, "Registro de compra não encontrado");

		if (registro.status !== "CRIADO")
			return SR.unprocessableEntity(undefined, `Não é possível registrar resposta no status ${registro.status}`);

		if (!dto.aprovado && !dto.motivoRecusa && !dto.mensagem) return SR.badRequest(undefined, "Informe o motivo da recusa");

		await this.gateway.atualizar(id, {
			status: dto.aprovado ? "APROVADO_FORNECEDOR" : "RECUSADO_FORNECEDOR",
			fornecedorRespostaCodigo: dto.codigo,
			fornecedorMensagem: dto.mensagem,
			fornecedorPayload: dto.payload,
			aprovadoEm: dto.aprovado ? new Date() : null,
			recusadoEm: dto.aprovado ? null : new Date(),
			motivoRecusa: dto.aprovado ? null : (dto.motivoRecusa ?? dto.mensagem),
		});

		const detalhe = await this.gateway.buscarDetalhePorId(id);
		return SR.ok(detalhe, "Resposta do fornecedor registrada");
	}
}
