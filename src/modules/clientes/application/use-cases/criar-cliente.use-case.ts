import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../../../common/validators/cpf-cnpj.validator";
import { Cliente } from "../../domain/cliente.entity";
import { CreateClienteDto } from "../../dto/create-cliente.dto";
import { CLIENTES_GATEWAY, type ClienteRegistro, type ClientesGatewayPort } from "../ports/clientes.gateway";

@Injectable()
export class CriarClienteUseCase {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly gateway: ClientesGatewayPort) {}

	async execute(dto: CreateClienteDto): Promise<IServiceResponse<ClienteRegistro>> {
		const documento = normalizeCpfOrCnpj(dto.documento);
		const tipoDocumento = documento.length === 11 ? "CPF" : "CNPJ";

		const exists = await this.gateway.buscarPorDocumento(documento);
		if (exists) return SR.conflict<ClienteRegistro>(undefined, "Documento já cadastrado");

		const cliente = Cliente.criar({ nome: dto.nome, documento, email: dto.email ?? null });

		const created = await this.gateway.criar({
			nome: cliente.nome,
			documento: cliente.documento,
			tipoDocumento,
			email: dto.email,
			telefone: dto.telefone,
			endereco: dto.endereco,
		});

		return SR.created(created, "Cliente cadastrado com sucesso");
	}
}
