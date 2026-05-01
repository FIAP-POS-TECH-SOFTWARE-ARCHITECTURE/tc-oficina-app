import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ClientesModule } from "./clientes/clientes.module";
import { InsumosModule } from "./insumos/insumos.module";
import { OrdensServicoModule } from "./ordens-servico/ordens-servico.module";
import { ServicosModule } from "./servicos/servicos.module";
import { UsuariosModule } from "./usuarios/usuarios.module";
import { VeiculosModule } from "./veiculos/veiculos.module";

@Module({
	imports: [AuthModule, UsuariosModule, ClientesModule, VeiculosModule, ServicosModule, InsumosModule, OrdensServicoModule],
	exports: [AuthModule, UsuariosModule, ClientesModule, VeiculosModule, ServicosModule, InsumosModule, OrdensServicoModule],
})
export class ModulesModule {}
