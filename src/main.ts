import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import morgan from "morgan";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

async function bootstrap() {
	if (!process.env.PORT) throw new Error("PORT não definido no .env");
	if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET não definido no .env");
	if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não definido no .env");

	const app = await NestFactory.create(AppModule);

	app.enableCors();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	const reflector = app.get(Reflector);
	const jwtService = app.get(JwtService);

	app.useGlobalGuards(new JwtAuthGuard(jwtService, reflector), new RolesGuard(reflector));
	app.useGlobalInterceptors(new ResponseInterceptor());
	app.useGlobalFilters(new AllExceptionsFilter());

	app.use(morgan("dev"));

	await app.listen(process.env.PORT);

	console.log(`🚀 aplicação rodando em: http://localhost:${process.env.PORT}`);
}

bootstrap();
