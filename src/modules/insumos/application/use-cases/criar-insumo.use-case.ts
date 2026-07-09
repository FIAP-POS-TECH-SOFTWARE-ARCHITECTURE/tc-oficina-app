import { Inject, Injectable } from "@nestjs/common";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../../../common/utils/service-response.util";
import { Insumo } from "../../domain/insumo.entity";
import { CreateInsumoDto } from "../../dto/create-insumo.dto";
import { INSUMOS_GATEWAY, type InsumoRegistro, type InsumosGatewayPort } from "../ports/insumos.gateway";

@Injectable()
export class CriarInsumoUseCase {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly gateway: InsumosGatewayPort) {}

	async execute(dto: CreateInsumoDto): Promise<IServiceResponse<InsumoRegistro>> {
		const exists = await this.gateway.buscarPorCodigo(dto.codigo);
		if (exists) return SR.conflict<InsumoRegistro>(undefined, "Código de insumo já cadastrado");

		const insumo = Insumo.criar({
			codigo: dto.codigo,
			nome: dto.nome,
			descricao: dto.descricao ?? null,
			precoUnitario: dto.precoUnitario,
			estoqueMinimo: dto.estoqueMinimo,
			quantidadeEstoque: dto.quantidadeEstoque,
		});

		const created = await this.gateway.criar({
			codigo: insumo.codigo,
			nome: insumo.nome,
			descricao: dto.descricao,
			precoUnitario: insumo.precoUnitario,
			estoqueMinimo: insumo.estoqueMinimo,
			quantidadeEstoque: insumo.quantidadeEstoque,
		});

		return SR.created(created, "Insumo cadastrado");
	}
}
