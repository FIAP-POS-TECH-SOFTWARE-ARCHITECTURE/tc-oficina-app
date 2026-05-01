import { Module } from "@nestjs/common";
import { ClientesModule } from "../clientes/clientes.module";
import { VeiculosController } from "./veiculos.controller";
import { VeiculosRepository } from "./veiculos.repository";
import { VeiculosService } from "./veiculos.service";

@Module({
	imports: [ClientesModule],
	controllers: [VeiculosController],
	providers: [VeiculosService, VeiculosRepository],
	exports: [VeiculosService, VeiculosRepository],
})
export class VeiculosModule {}
