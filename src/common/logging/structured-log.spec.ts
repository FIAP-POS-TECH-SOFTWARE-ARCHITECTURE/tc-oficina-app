import { Writable } from "node:stream";
import { Logger, PinoLogger } from "nestjs-pino";
import { __resetOutOfContextForTests } from "nestjs-pino/PinoLogger";

/**
 * Garante o contrato de serialização exigido pelo spec 06 (queries NRQL no New Relic):
 * uma chamada "object-first" — logger.log({ event, osId, numero }) — precisa emitir
 * essas chaves no TOPO do registro JSON, não aninhadas sob "msg" nem stringificadas.
 *
 * Padrão de uso para eventos de negócio (Task 5):
 *   this.logger.log({ event: "os.criada", osId, numero }, ContextName);
 */
describe("logs estruturados — shape serializado", () => {
	const captured: Record<string, unknown>[] = [];

	beforeEach(() => {
		captured.length = 0;
		__resetOutOfContextForTests();
	});

	function buildLogger(): Logger {
		const stream = new Writable({
			write(chunk, _enc, cb) {
				captured.push(JSON.parse(chunk.toString()));
				cb();
			},
		});
		const pinoLogger = new PinoLogger({ pinoHttp: { level: "info", stream } });
		return new Logger(pinoLogger, {});
	}

	it("emite as chaves de um log object-first no nível raiz do JSON", () => {
		const logger = buildLogger();

		logger.log({ event: "os.criada", osId: "abc-123", numero: "OS-0001" }, "OrdensServicoUseCase");

		expect(captured).toHaveLength(1);
		const record = captured[0];
		expect(record.event).toBe("os.criada");
		expect(record.osId).toBe("abc-123");
		expect(record.numero).toBe("OS-0001");
		expect(record.context).toBe("OrdensServicoUseCase");
		// não pode ter aninhado o objeto dentro de msg
		expect(typeof record.msg === "string" && record.msg.includes("os.criada")).toBe(false);
	});
});
