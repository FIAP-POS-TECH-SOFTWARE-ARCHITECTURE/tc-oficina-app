import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
	apiOnline(): string {
		return "API Online!";
	}
}
