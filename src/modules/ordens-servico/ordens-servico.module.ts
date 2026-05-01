import { Module } from "@nestjs/common";
import { ClientesModule } from "../clientes/clientes.module";
import { InsumosModule } from "../insumos/insumos.module";
import { ServicosModule } from "../servicos/servicos.module";
import { VeiculosModule } from "../veiculos/veiculos.module";
import { OrdensServicoController } from "./ordens-servico.controller";
import { OrdensServicoRepository } from "./ordens-servico.repository";
import { OrdensServicoService } from "./ordens-servico.service";

@Module({
	imports: [ClientesModule, VeiculosModule, ServicosModule, InsumosModule],
	controllers: [OrdensServicoController],
	providers: [OrdensServicoService, OrdensServicoRepository],
	exports: [OrdensServicoService, OrdensServicoRepository],
})
export class OrdensServicoModule {}
