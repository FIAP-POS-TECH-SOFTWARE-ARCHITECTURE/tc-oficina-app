import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { normalizarPlaca } from "../../../../common/validators/placa.validator";
import { CLIENTES_GATEWAY, type ClientesGatewayPort } from "../../../clientes/application/ports/clientes.gateway";
import { Veiculo } from "../../domain/veiculo.entity";
import { CreateVeiculoDto } from "../../dto/create-veiculo.dto";
import { VEICULOS_GATEWAY, type VeiculoRegistro, type VeiculosGatewayPort } from "../ports/veiculos.gateway";

@Injectable()
export class CriarVeiculoUseCase {
	constructor(
		@Inject(VEICULOS_GATEWAY) private readonly gateway: VeiculosGatewayPort,
		@Inject(CLIENTES_GATEWAY) private readonly clientes: ClientesGatewayPort,
	) {}

	async execute(clienteId: string, dto: CreateVeiculoDto): Promise<IServiceResponse<VeiculoRegistro>> {
		const cliente = await this.clientes.buscarPorId(clienteId);
		if (!cliente) return SR.notFound<VeiculoRegistro>(undefined, "Cliente não encontrado");
		if (cliente.ativo === false) return SR.unprocessableEntity<VeiculoRegistro>(undefined, "Cliente inativado");

		const placa = normalizarPlaca(dto.placa);
		const exists = await this.gateway.buscarPorPlaca(placa);
		if (exists) return SR.conflict<VeiculoRegistro>(undefined, "Placa já cadastrada");

		const veiculo = Veiculo.criar({ placa, marca: dto.marca, modelo: dto.modelo, ano: dto.ano, clienteId });

		const created = await this.gateway.criar({
			placa: veiculo.placa,
			marca: veiculo.marca,
			modelo: veiculo.modelo,
			ano: veiculo.ano,
			clienteId: veiculo.clienteId,
		});

		return SR.created(created, "Veículo cadastrado");
	}
}
