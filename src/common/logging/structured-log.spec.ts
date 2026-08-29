import { Writable } from "node:stream";
import pino from "pino";
import { Logger } from "@nestjs/common";
import { Logger as NestPinoLogger, PinoLogger } from "nestjs-pino";
import { __resetOutOfContextForTests } from "nestjs-pino/PinoLogger";
import { storage, Store } from "nestjs-pino/storage";

/**
 * Garante o contrato de serialização exigido pelas queries NRQL no New Relic
 * pelo MESMO caminho de emissão que a produção usa: `app.useLogger(app.get(Logger))`
 * (nestjs-pino) e, nos serviços, `new Logger("Contexto")` do `@nestjs/common`.
 * Aqui isso é reproduzido com `Logger.overrideLogger(...)`, o mecanismo estático que
 * o `app.useLogger` aciona por baixo.
 *
 * Cobre dois critérios de aceite:
 *  - chamada "object-first" — logger.log({ event, osId, numero }) — emite essas chaves
 *    no TOPO do registro JSON, não aninhadas sob "msg" nem stringificadas;
 *  - "logs em JSON com requestId propagado": uma chamada dentro do contexto
 *    AsyncLocalStorage do nestjs-pino (o mesmo Store que o middleware pino-http monta
 *    por request, com o child logger carregando o requestId de `customProps`/`genReqId`)
 *    emite o registro do evento de negócio já com o `requestId`.
 */
describe("logs estruturados — shape serializado", () => {
	const captured: Record<string, unknown>[] = [];
	let stream: Writable;

	beforeEach(() => {
		captured.length = 0;
		__resetOutOfContextForTests();
		stream = new Writable({
			write(chunk, _enc, cb) {
				captured.push(JSON.parse(chunk.toString()));
				cb();
			},
		});
		const pinoLogger = new PinoLogger({ pinoHttp: { level: "info", stream } });
		Logger.overrideLogger(new NestPinoLogger(pinoLogger, {}));
	});

	afterEach(() => {
		// desfaz o override global pra não vazar pro resto da suíte
		Logger.overrideLogger(false);
	});

	it("emite as chaves de um log object-first no nível raiz do JSON", () => {
		const logger = new Logger("OrdensServicoUseCase");

		logger.log({ event: "os.status.changed", osId: "abc-123", numero: "OS-0001", durationMs: 42 });

		expect(captured).toHaveLength(1);
		const record = captured[0];
		expect(record.event).toBe("os.status.changed");
		expect(record.osId).toBe("abc-123");
		expect(record.numero).toBe("OS-0001");
		expect(record.durationMs).toBe(42);
		expect(record.context).toBe("OrdensServicoUseCase");
		// não pode ter aninhado o objeto dentro de msg
		expect(typeof record.msg === "string" && record.msg.includes("os.status.changed")).toBe(false);
	});

	it("propaga o requestId do contexto de request para o registro do evento de negócio", () => {
		const logger = new Logger("OrdensServicoUseCase");
		// child logger com o requestId, igual ao que o pino-http monta por request
		// (genReqId -> req.id -> customProps({ requestId }) no LoggerModule.forRoot).
		const requestScoped = pino({ level: "info" }, stream).child({ requestId: "req-abc-123" });

		storage.run(new Store(requestScoped), () => {
			logger.log({ event: "os.created", osId: "def-456", numero: "OS-0002" });
		});

		expect(captured).toHaveLength(1);
		const record = captured[0];
		expect(record.requestId).toBe("req-abc-123");
		expect(record.event).toBe("os.created");
		expect(record.numero).toBe("OS-0002");
	});
});
