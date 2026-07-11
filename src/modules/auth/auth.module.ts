import { Module } from "@nestjs/common";
import { UsuariosModule } from "../usuarios/usuarios.module";
import { AuthController } from "./adapters/auth.controller";
import { JwtTokenGateway } from "./adapters/gateways/jwt-token.gateway";
import { TOKEN } from "./application/ports/token.gateway";
import { LoginUseCase } from "./application/use-cases/login.use-case";

@Module({
	imports: [UsuariosModule],
	controllers: [AuthController],
	providers: [LoginUseCase, { provide: TOKEN, useClass: JwtTokenGateway }],
})
export class AuthModule {}
