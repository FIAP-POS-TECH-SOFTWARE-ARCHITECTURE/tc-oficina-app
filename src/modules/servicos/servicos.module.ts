import { Module } from "@nestjs/common";
import { ServicosController } from "./servicos.controller";
import { ServicosRepository } from "./servicos.repository";
import { ServicosService } from "./servicos.service";

@Module({
	controllers: [ServicosController],
	providers: [ServicosService, ServicosRepository],
	exports: [ServicosService, ServicosRepository],
})
export class ServicosModule {}
