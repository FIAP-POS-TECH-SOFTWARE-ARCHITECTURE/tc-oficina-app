import { Injectable } from "@nestjs/common";
import { ClientesRepository } from "../../../clientes/clientes.repository";
import { InsumosRepository } from "../../../insumos/insumos.repository";
import { ServicosRepository } from "../../../servicos/servicos.repository";
import { VeiculosRepository } from "../../../veiculos/veiculos.repository";
import {
	ClientesConsultaPort,
	InsumosConsultaPort,
	ServicosConsultaPort,
	VeiculosConsultaPort,
} from "../../application/ports/consultas-externas.gateway";

@Injectable()
export class ClientesConsultaPrismaGateway implements ClientesConsultaPort {
	constructor(private readonly repo: ClientesRepository) {}
	buscarPorId(id: string) {
		return this.repo.findById(id);
	}
}

@Injectable()
export class VeiculosConsultaPrismaGateway implements VeiculosConsultaPort {
	constructor(private readonly repo: VeiculosRepository) {}
	buscarPorId(id: string) {
		return this.repo.findById(id);
	}
}

@Injectable()
export class ServicosConsultaPrismaGateway implements ServicosConsultaPort {
	constructor(private readonly repo: ServicosRepository) {}
	buscarPorId(id: string) {
		return this.repo.findById(id);
	}
}

@Injectable()
export class InsumosConsultaPrismaGateway implements InsumosConsultaPort {
	constructor(private readonly repo: InsumosRepository) {}
	buscarPorId(id: string) {
		return this.repo.findById(id);
	}
}
