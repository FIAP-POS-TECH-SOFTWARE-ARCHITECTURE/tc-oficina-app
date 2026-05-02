import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Public } from "./common/decorators/public.decorator";
import { ApiEnvelopedResponse } from "./common/decorators/api-enveloped-response.decorator";

@ApiTags("Geral")
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Public()
	@Get()
	@ApiOperation({ summary: "Verificar se a API está online" })
	@ApiEnvelopedResponse(String)
	apiOnline(): string {
		return this.appService.apiOnline();
	}
}
