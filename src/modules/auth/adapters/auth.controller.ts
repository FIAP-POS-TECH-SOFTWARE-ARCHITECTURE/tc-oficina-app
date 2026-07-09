import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelopedResponse } from "../../../common/decorators/api-enveloped-response.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { LoginUseCase } from "../application/use-cases/login.use-case";
import { LoginResponseDto } from "../dto/login-response.dto";
import { LoginDto } from "../dto/login.dto";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
	constructor(private readonly loginUseCase: LoginUseCase) {}

	@Public()
	@Post("login")
	@ApiOperation({ summary: "Realizar login" })
	@ApiEnvelopedResponse(LoginResponseDto)
	login(@Body() dto: LoginDto) {
		return this.loginUseCase.execute(dto);
	}
}
