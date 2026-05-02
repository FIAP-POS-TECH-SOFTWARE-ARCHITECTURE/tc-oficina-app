import { Injectable } from "@nestjs/common";
import { Veiculo } from "@prisma/client";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../common/utils/service-response.util";
import { normalizarPlaca } from "../../common/validators/placa.validator";
import { ClientesRepository } from "../clientes/clientes.repository";
import { CreateVeiculoDto } from "./dto/create-veiculo.dto";
import { UpdateVeiculoDto } from "./dto/update-veiculo.dto";
import { VeiculosRepository } from "./veiculos.repository";

@Injectable()
export class VeiculosService {
	constructor(
		private readonly repo: VeiculosRepository,
		private readonly clientes: ClientesRepository,
	) {}

	async create(clienteId: string, dto: CreateVeiculoDto): Promise<IServiceResponse<Veiculo>> {
		const cliente = await this.clientes.findById(clienteId);
		if (!cliente) return SR.notFound<Veiculo>(undefined, "Cliente não encontrado");
		if (cliente.ativo === false) return SR.unprocessableEntity<Veiculo>(undefined, "Cliente inativado");

		const placa = normalizarPlaca(dto.placa);
		const exists = await this.repo.findByPlaca(placa);
		if (exists) return SR.conflict<Veiculo>(undefined, "Placa já cadastrada");

		const created = await this.repo.create({
			placa,
			marca: dto.marca,
			modelo: dto.modelo,
			ano: dto.ano,
			clienteId,
		});

		return SR.created(created, "Veículo cadastrado");
	}

	async findByCliente(clienteId: string): Promise<IServiceResponse<Veiculo[]>> {
		const cliente = await this.clientes.findById(clienteId);
		if (!cliente) return SR.notFound<Veiculo[]>(undefined, "Cliente não encontrado");

		return SR.ok(await this.repo.findByCliente(clienteId));
	}

	async findById(id: string): Promise<IServiceResponse<Veiculo>> {
		const veiculo = await this.repo.findById(id);
		if (!veiculo) return SR.notFound<Veiculo>(undefined, "Veículo não encontrado");

		return SR.ok(veiculo);
	}

	async findByPlaca(placa: string): Promise<IServiceResponse<Veiculo>> {
		const veiculo = await this.repo.findByPlaca(normalizarPlaca(placa));
		if (!veiculo) return SR.notFound<Veiculo>(undefined, "Veículo não encontrado");

		return SR.ok(veiculo);
	}

	async update(id: string, dto: UpdateVeiculoDto): Promise<IServiceResponse<Veiculo>> {
		const veiculo = await this.repo.findById(id);
		if (!veiculo) return SR.notFound<Veiculo>(undefined, "Veículo não encontrado");
		if (veiculo.ativo === false) return SR.unprocessableEntity<Veiculo>(undefined, "Veículo inativado");

		const updated = await this.repo.update(id, dto);
		return SR.ok(updated, "Veículo atualizado");
	}

	async remove(id: string): Promise<IServiceResponse<Veiculo>> {
		const veiculo = await this.repo.findById(id);
		if (!veiculo) return SR.notFound<Veiculo>(undefined, "Veículo não encontrado");
		if (veiculo.ativo === false) return SR.unprocessableEntity<Veiculo>(undefined, "Veículo já está inativado");

		const aberto = await this.repo.hasOrdensAbertas(id);
		if (aberto > 0) return SR.conflict<Veiculo>(undefined, "Veículo possui ordens de serviço abertas e não pode ser inativado");

		const updated = await this.repo.softDelete(id);
		return SR.ok(updated, "Veículo inativado");
	}
}
