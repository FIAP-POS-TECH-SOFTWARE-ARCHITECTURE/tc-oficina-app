import { Injectable } from "@nestjs/common";
import { Servico } from "@prisma/client";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../common/utils/service-response.util";
import { CreateServicoDto } from "./dto/create-servico.dto";
import { UpdateServicoDto } from "./dto/update-servico.dto";
import { ServicosRepository } from "./servicos.repository";

@Injectable()
export class ServicosService {
	constructor(private readonly repo: ServicosRepository) {}

	async create(dto: CreateServicoDto): Promise<IServiceResponse<Servico>> {
		const exists = await this.repo.findByNome(dto.nome);
		if (exists) return SR.conflict<Servico>(undefined, "Já existe serviço com esse nome");
		
		const created = await this.repo.create({
			nome: dto.nome,
			descricao: dto.descricao,
			preco: dto.preco,
			tempoEstimadoMin: dto.tempoEstimadoMin,
		});
		
		return SR.created(created, "Serviço cadastrado");
	}

	async findAll(): Promise<IServiceResponse<Servico[]>> {
		return SR.ok(await this.repo.findAll());
	}

	async findById(id: string): Promise<IServiceResponse<Servico>> {
		const s = await this.repo.findById(id);
		if (!s) return SR.notFound<Servico>(undefined, "Serviço não encontrado");
		
		return SR.ok(s);
	}

	async update(id: string, dto: UpdateServicoDto): Promise<IServiceResponse<Servico>> {
		const s = await this.repo.findById(id);
		if (!s) return SR.notFound<Servico>(undefined, "Serviço não encontrado");
		
		if (dto.nome && dto.nome !== s.nome) {
			const conflict = await this.repo.findByNome(dto.nome);
			if (conflict) return SR.conflict<Servico>(undefined, "Já existe serviço com esse nome");
		}
		
		const updated = await this.repo.update(id, dto);
		return SR.ok(updated, "Serviço atualizado");
	}

	async remove(id: string): Promise<IServiceResponse<Servico>> {
		const s = await this.repo.findById(id);
		if (!s) return SR.notFound<Servico>(undefined, "Serviço não encontrado");
		
		const updated = await this.repo.softDelete(id);
		return SR.ok(updated, "Serviço inativado");
	}
}
