import { Module } from "@nestjs/common";
import { FornecedorStubService } from "./fornecedor-stub.service";
import { InsumosController } from "./insumos.controller";
import { InsumosRepository } from "./insumos.repository";
import { InsumosService } from "./insumos.service";
import { RegistrosCompraController } from "./registros-compra.controller";
import { RegistrosCompraRepository } from "./registros-compra.repository";
import { RegistrosCompraService } from "./registros-compra.service";

@Module({
	controllers: [RegistrosCompraController, InsumosController],
	providers: [InsumosService, InsumosRepository, RegistrosCompraService, RegistrosCompraRepository, FornecedorStubService],
	exports: [InsumosService, InsumosRepository, RegistrosCompraService, RegistrosCompraRepository],
})
export class InsumosModule {}
