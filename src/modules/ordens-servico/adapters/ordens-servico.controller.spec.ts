import { IS_PUBLIC_KEY } from "../../../common/decorators/public.decorator";
import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { Role } from "../../../common/enums/role.enum";
import { OrdensServicoController } from "./ordens-servico.controller";

const useCaseNames = [
	"criarOs",
	"listarOs",
	"buscarOs",
	"historicoOs",
	"tempoMedioServicos",
	"consultaPublicaOs",
	"iniciarDiagnosticoUc",
	"atualizarDiagnosticoUc",
	"addItemServicoUc",
	"removerItemServicoUc",
	"iniciarItemServicoUc",
	"concluirItemServicoUc",
	"cancelarItemServicoUc",
	"addItemInsumoUc",
	"removerItemInsumoUc",
	"gerarOrcamentoUc",
	"aprovarOrcamentoUc",
	"rejeitarOrcamentoUc",
	"finalizarOs",
	"entregarOs",
	"desbloquearOs",
	"cancelarOs",
] as const;

describe("OrdensServicoController", () => {
	let ucs: Record<(typeof useCaseNames)[number], { execute: jest.Mock }>;
	let controller: OrdensServicoController;
	const user = { id: "u1", email: "x@x", role: Role.MECANICO };

	beforeEach(() => {
		ucs = Object.fromEntries(useCaseNames.map((n) => [n, { execute: jest.fn().mockResolvedValue({ status: 200 }) }])) as typeof ucs;
		controller = new OrdensServicoController(
			...(useCaseNames.map((n) => ucs[n]) as unknown as ConstructorParameters<typeof OrdensServicoController>),
		);
	});

	describe("delegação para use cases", () => {
		it("create", async () => {
			await controller.create({ clienteId: "c1", veiculoId: "v1" });
			expect(ucs.criarOs.execute).toHaveBeenCalledWith({ clienteId: "c1", veiculoId: "v1" });
		});

		it("list", async () => {
			await controller.list({});
			expect(ucs.listarOs.execute).toHaveBeenCalledWith({});
		});

		it("obterHistorico", async () => {
			await controller.obterHistorico("os1");
			expect(ucs.historicoOs.execute).toHaveBeenCalledWith("os1");
		});

		it("metricas", async () => {
			await controller.metricas({ filtro: "ativos" });
			expect(ucs.tempoMedioServicos.execute).toHaveBeenCalledWith("ativos");
		});

		it("consultaPublica", async () => {
			await controller.consultaPublica("OS-2026-000001", "529.982.247-25");
			expect(ucs.consultaPublicaOs.execute).toHaveBeenCalledWith("OS-2026-000001", "529.982.247-25");
		});

		it("findOne", async () => {
			await controller.findOne("os1");
			expect(ucs.buscarOs.execute).toHaveBeenCalledWith("os1");
		});

		it("iniciarDiagnostico passa user.id", async () => {
			await controller.iniciarDiagnostico("os1", user);
			expect(ucs.iniciarDiagnosticoUc.execute).toHaveBeenCalledWith("os1", "u1");
		});

		it("atualizarDiagnostico", async () => {
			await controller.atualizarDiagnostico("os1", { diagnostico: "x" });
			expect(ucs.atualizarDiagnosticoUc.execute).toHaveBeenCalledWith("os1", { diagnostico: "x" });
		});

		it("addItemServico", async () => {
			await controller.addItemServico("os1", { servicoId: "s1" });
			expect(ucs.addItemServicoUc.execute).toHaveBeenCalledWith("os1", { servicoId: "s1" });
		});

		it("removerItemServico", async () => {
			await controller.removerItemServico("os1", "i1");
			expect(ucs.removerItemServicoUc.execute).toHaveBeenCalledWith("os1", "i1");
		});

		it("iniciarItemServico", async () => {
			await controller.iniciarItemServico("os1", "i1");
			expect(ucs.iniciarItemServicoUc.execute).toHaveBeenCalledWith("os1", "i1");
		});

		it("concluirItemServico", async () => {
			await controller.concluirItemServico("os1", "i1");
			expect(ucs.concluirItemServicoUc.execute).toHaveBeenCalledWith("os1", "i1");
		});

		it("cancelarItemServico", async () => {
			await controller.cancelarItemServico("os1", "i1");
			expect(ucs.cancelarItemServicoUc.execute).toHaveBeenCalledWith("os1", "i1");
		});

		it("addItemInsumo", async () => {
			await controller.addItemInsumo("os1", { insumoId: "i1", quantidade: 1 });
			expect(ucs.addItemInsumoUc.execute).toHaveBeenCalledWith("os1", { insumoId: "i1", quantidade: 1 });
		});

		it("removerItemInsumo", async () => {
			await controller.removerItemInsumo("os1", "ii1");
			expect(ucs.removerItemInsumoUc.execute).toHaveBeenCalledWith("os1", "ii1");
		});

		it("gerarOrcamento passa user.id", async () => {
			await controller.gerarOrcamento("os1", user);
			expect(ucs.gerarOrcamentoUc.execute).toHaveBeenCalledWith("os1", "u1");
		});

		it("aprovar (público) delega", async () => {
			await controller.aprovar("OS-2026-000001", { documento: "529.982.247-25" });
			expect(ucs.aprovarOrcamentoUc.execute).toHaveBeenCalledWith("OS-2026-000001", { documento: "529.982.247-25" });
		});

		it("rejeitar (público) delega", async () => {
			await controller.rejeitar("OS-2026-000001", { documento: "529.982.247-25" });
			expect(ucs.rejeitarOrcamentoUc.execute).toHaveBeenCalledWith("OS-2026-000001", { documento: "529.982.247-25" });
		});

		it("finalizar passa user.id", async () => {
			await controller.finalizar("os1", user);
			expect(ucs.finalizarOs.execute).toHaveBeenCalledWith("os1", "u1");
		});

		it("entregar passa user.id", async () => {
			await controller.entregar("os1", user);
			expect(ucs.entregarOs.execute).toHaveBeenCalledWith("os1", "u1");
		});

		it("desbloquear passa user.id+dto", async () => {
			await controller.desbloquear("os1", { observacao: "x" }, user);
			expect(ucs.desbloquearOs.execute).toHaveBeenCalledWith("os1", "u1", { observacao: "x" });
		});

		it("cancelar passa user.id+dto", async () => {
			await controller.cancelar("os1", { motivo: "x" }, user);
			expect(ucs.cancelarOs.execute).toHaveBeenCalledWith("os1", "u1", { motivo: "x" });
		});
	});

	describe("decorators críticos", () => {
		it("consultaPublica é @Public()", () => {
			expect(Reflect.getMetadata(IS_PUBLIC_KEY, OrdensServicoController.prototype.consultaPublica)).toBe(true);
		});

		it("aprovar e rejeitar são @Public()", () => {
			expect(Reflect.getMetadata(IS_PUBLIC_KEY, OrdensServicoController.prototype.aprovar)).toBe(true);
			expect(Reflect.getMetadata(IS_PUBLIC_KEY, OrdensServicoController.prototype.rejeitar)).toBe(true);
		});

		it("cancelar exige ADMINISTRADOR", () => {
			expect(Reflect.getMetadata(ROLES_KEY, OrdensServicoController.prototype.cancelar)).toEqual([Role.ADMINISTRADOR]);
		});

		it("metricas exige ADMINISTRADOR", () => {
			expect(Reflect.getMetadata(ROLES_KEY, OrdensServicoController.prototype.metricas)).toEqual([Role.ADMINISTRADOR]);
		});

		it("itens-servico (mecanico)", () => {
			for (const m of ["addItemServico", "iniciarItemServico", "concluirItemServico", "cancelarItemServico"] as const) {
				expect(Reflect.getMetadata(ROLES_KEY, OrdensServicoController.prototype[m])).toEqual([Role.MECANICO]);
			}
		});
	});
});
