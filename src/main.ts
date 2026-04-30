import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import morgan from "morgan";

async function bootstrap() {
	if (!process.env.PORT) throw new Error("PORT não definido no .env");
	if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não definido no .env");

	const app = await NestFactory.create(AppModule);

	app.enableCors();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	);

	app.use(morgan("dev"));

	await app.listen(process.env.PORT);

	console.log(`🚀 aplicação rodando em: http://localhost:${process.env.PORT}`);
}

bootstrap();
