import { Injectable } from "@nestjs/common";
import { Cliente, TipoDocumentoCliente } from "@prisma/client";
import type { IServiceResponse } from "semantic-response";
import { SR } from "../../common/utils/service-response.util";
import { normalizeCpfOrCnpj } from "../../common/validators/cpf-cnpj.validator";
import { ClientesRepository } from "./clientes.repository";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";

@Injectable()
export class ClientesService {
	constructor(private readonly repo: ClientesRepository) {}

	async create(dto: CreateClienteDto): Promise<IServiceResponse<Cliente>> {
		const documento = normalizeCpfOrCnpj(dto.documento);
		const tipoDocumento: TipoDocumentoCliente = documento.length === 11 ? TipoDocumentoCliente.CPF : TipoDocumentoCliente.CNPJ;
		const exists = await this.repo.findByDocumento(documento);
		if (exists) return SR.conflict<Cliente>(undefined, "Documento já cadastrado");
		const created = await this.repo.create({
			nome: dto.nome,
			documento,
			tipoDocumento,
			email: dto.email,
			telefone: dto.telefone,
			endereco: dto.endereco,
		});
		return SR.created(created, "Cliente cadastrado com sucesso");
	}

	async findAll(): Promise<IServiceResponse<Cliente[]>> {
		return SR.ok(await this.repo.findAll());
	}

	async findById(id: string): Promise<IServiceResponse<Cliente>> {
		const cliente = await this.repo.findById(id);
		if (!cliente) return SR.notFound<Cliente>(undefined, "Cliente não encontrado");
		return SR.ok(cliente);
	}

	async findByDocumento(documento: string): Promise<IServiceResponse<Cliente>> {
		const cliente = await this.repo.findByDocumento(normalizeCpfOrCnpj(documento));
		if (!cliente) return SR.notFound<Cliente>(undefined, "Cliente não encontrado");
		return SR.ok(cliente);
	}

	async update(id: string, dto: UpdateClienteDto): Promise<IServiceResponse<Cliente>> {
		const cliente = await this.repo.findById(id);
		if (!cliente) return SR.notFound<Cliente>(undefined, "Cliente não encontrado");
		const updated = await this.repo.update(id, dto);
		return SR.ok(updated, "Cliente atualizado");
	}

	async remove(id: string): Promise<IServiceResponse<Cliente>> {
		const cliente = await this.repo.findById(id);
		if (!cliente) return SR.notFound<Cliente>(undefined, "Cliente não encontrado");
		const aberto = await this.repo.hasOrdensAbertas(id);
		if (aberto > 0) {
			return SR.conflict<Cliente>(undefined, "Cliente possui ordens de serviço abertas e não pode ser inativado");
		}
		const updated = await this.repo.softDelete(id);
		return SR.ok(updated, "Cliente inativado");
	}
}
