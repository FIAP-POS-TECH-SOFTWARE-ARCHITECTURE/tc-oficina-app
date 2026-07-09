import { Inject, Injectable } from "@nestjs/common";
import { CLIENTES_GATEWAY, type ClientesGatewayPort } from "../../../clientes/application/ports/clientes.gateway";
import { INSUMOS_GATEWAY, type InsumosGatewayPort } from "../../../insumos/application/ports/insumos.gateway";
import { SERVICOS_GATEWAY, type ServicosGatewayPort } from "../../../servicos/application/ports/servicos.gateway";
import { VEICULOS_GATEWAY, type VeiculosGatewayPort } from "../../../veiculos/application/ports/veiculos.gateway";
import {
	ClientesConsultaPort,
	InsumosConsultaPort,
	ServicosConsultaPort,
	VeiculosConsultaPort,
} from "../../application/ports/consultas-externas.gateway";

@Injectable()
export class ClientesConsultaPrismaGateway implements ClientesConsultaPort {
	constructor(@Inject(CLIENTES_GATEWAY) private readonly clientes: ClientesGatewayPort) {}
	buscarPorId(id: string) {
		return this.clientes.buscarPorId(id);
	}
}

@Injectable()
export class VeiculosConsultaPrismaGateway implements VeiculosConsultaPort {
	constructor(@Inject(VEICULOS_GATEWAY) private readonly veiculos: VeiculosGatewayPort) {}
	buscarPorId(id: string) {
		return this.veiculos.buscarPorId(id);
	}
}

@Injectable()
export class ServicosConsultaPrismaGateway implements ServicosConsultaPort {
	constructor(@Inject(SERVICOS_GATEWAY) private readonly servicos: ServicosGatewayPort) {}
	buscarPorId(id: string) {
		return this.servicos.buscarPorId(id);
	}
}

@Injectable()
export class InsumosConsultaPrismaGateway implements InsumosConsultaPort {
	constructor(@Inject(INSUMOS_GATEWAY) private readonly insumos: InsumosGatewayPort) {}
	buscarPorId(id: string) {
		return this.insumos.buscarPorId(id);
	}
}
