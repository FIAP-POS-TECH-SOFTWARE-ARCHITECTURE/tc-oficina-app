import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { ModulesModule } from "./modules/modules.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
	imports: [
		ConfigModule.forRoot(),
		JwtModule.register({
			global: true,
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: "8h" },
		}),
		PrismaModule,
		ModulesModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
