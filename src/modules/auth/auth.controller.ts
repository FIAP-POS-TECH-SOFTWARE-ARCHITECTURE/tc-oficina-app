import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../common/decorators/api-enveloped-response.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { LoginResponseDto } from "./dto/login-response.dto";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
	constructor(private readonly service: AuthService) {}

	@Public()
	@Post("login")
	@ApiOperation({ summary: "Realizar login" })
	@ApiEnvelopedResponse(LoginResponseDto)
	login(@Body() dto: LoginDto) {
		return this.service.login(dto);
	}
}
