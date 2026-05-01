import { Module } from "@nestjs/common";
import { InsumosController } from "./insumos.controller";
import { InsumosRepository } from "./insumos.repository";
import { InsumosService } from "./insumos.service";

@Module({
	controllers: [InsumosController],
	providers: [InsumosService, InsumosRepository],
	exports: [InsumosService, InsumosRepository],
})
export class InsumosModule {}
