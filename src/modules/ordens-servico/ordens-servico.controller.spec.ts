import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";
import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { OrdensServicoController } from "./ordens-servico.controller";
import { OrdensServicoService } from "./ordens-servico.service";

describe("OrdensServicoController", () => {
	let service: jest.Mocked<OrdensServicoService>;
	let controller: OrdensServicoController;
	const user = { id: "u1", email: "x@x", role: Role.MECANICO };

	beforeEach(() => {
		service = {
			create: jest.fn(),
			list: jest.fn(),
			findById: jest.fn(),
			tempoMedioExecucao: jest.fn(),
			consultaPublica: jest.fn(),
			iniciarDiagnostico: jest.fn(),
			atualizarDiagnostico: jest.fn(),
			addItemServico: jest.fn(),
			removerItemServico: jest.fn(),
			iniciarItemServico: jest.fn(),
			concluirItemServico: jest.fn(),
			cancelarItemServico: jest.fn(),
			addItemInsumo: jest.fn(),
			removerItemInsumo: jest.fn(),
			gerarOrcamento: jest.fn(),
			aprovarOrcamento: jest.fn(),
			rejeitarOrcamento: jest.fn(),
			finalizar: jest.fn(),
			entregar: jest.fn(),
			desbloquear: jest.fn(),
			cancelar: jest.fn(),
		} as unknown as jest.Mocked<OrdensServicoService>;
		controller = new OrdensServicoController(service);
	});

	describe("delegação simples", () => {
		const ok = { status: 200 } as any;
		beforeEach(() => {
			Object.values(service).forEach((fn: any) => fn.mockResolvedValue?.(ok));
		});

		it("create", async () => {
			await controller.create({ clienteId: "c1", veiculoId: "v1" } as any);
			expect(service.create).toHaveBeenCalled();
		});

		it("list", async () => {
			await controller.list({} as any);
			expect(service.list).toHaveBeenCalled();
		});

		it("metricas", async () => {
			await controller.metricas();
			expect(service.tempoMedioExecucao).toHaveBeenCalled();
		});

		it("consultaPublica", async () => {
			await controller.consultaPublica("OS-2026-000001", "529.982.247-25");
			expect(service.consultaPublica).toHaveBeenCalledWith("OS-2026-000001", "529.982.247-25");
		});

		it("findOne", async () => {
			await controller.findOne("os1");
			expect(service.findById).toHaveBeenCalledWith("os1");
		});

		it("iniciarDiagnostico passa user.id", async () => {
			await controller.iniciarDiagnostico("os1", user as any);
			expect(service.iniciarDiagnostico).toHaveBeenCalledWith("os1", "u1");
		});

		it("atualizarDiagnostico", async () => {
			await controller.atualizarDiagnostico("os1", { diagnostico: "x" } as any);
			expect(service.atualizarDiagnostico).toHaveBeenCalledWith("os1", { diagnostico: "x" });
		});

		it("addItemServico", async () => {
			await controller.addItemServico("os1", { servicoId: "s1" } as any);
			expect(service.addItemServico).toHaveBeenCalled();
		});

		it("removerItemServico", async () => {
			await controller.removerItemServico("os1", "i1");
			expect(service.removerItemServico).toHaveBeenCalledWith("os1", "i1");
		});

		it("iniciarItemServico", async () => {
			await controller.iniciarItemServico("os1", "i1");
			expect(service.iniciarItemServico).toHaveBeenCalledWith("os1", "i1");
		});

		it("concluirItemServico", async () => {
			await controller.concluirItemServico("os1", "i1");
			expect(service.concluirItemServico).toHaveBeenCalledWith("os1", "i1");
		});

		it("cancelarItemServico", async () => {
			await controller.cancelarItemServico("os1", "i1");
			expect(service.cancelarItemServico).toHaveBeenCalledWith("os1", "i1");
		});

		it("addItemInsumo", async () => {
			await controller.addItemInsumo("os1", { insumoId: "i1", quantidade: 1 } as any);
			expect(service.addItemInsumo).toHaveBeenCalled();
		});

		it("removerItemInsumo", async () => {
			await controller.removerItemInsumo("os1", "ii1");
			expect(service.removerItemInsumo).toHaveBeenCalledWith("os1", "ii1");
		});

		it("gerarOrcamento passa user.id", async () => {
			await controller.gerarOrcamento("os1", user as any);
			expect(service.gerarOrcamento).toHaveBeenCalledWith("os1", "u1");
		});

		it("aprovar (público) delega", async () => {
			await controller.aprovar("os1", { documento: "529.982.247-25" } as any);
			expect(service.aprovarOrcamento).toHaveBeenCalled();
		});

		it("rejeitar (público) delega", async () => {
			await controller.rejeitar("os1", { documento: "529.982.247-25" } as any);
			expect(service.rejeitarOrcamento).toHaveBeenCalled();
		});

		it("finalizar passa user.id", async () => {
			await controller.finalizar("os1", user as any);
			expect(service.finalizar).toHaveBeenCalledWith("os1", "u1");
		});

		it("entregar passa user.id", async () => {
			await controller.entregar("os1", user as any);
			expect(service.entregar).toHaveBeenCalledWith("os1", "u1");
		});

		it("desbloquear passa user.id+dto", async () => {
			await controller.desbloquear("os1", { observacao: "x" } as any, user as any);
			expect(service.desbloquear).toHaveBeenCalledWith("os1", "u1", { observacao: "x" });
		});

		it("cancelar passa user.id+dto", async () => {
			await controller.cancelar("os1", { motivo: "x" } as any, user as any);
			expect(service.cancelar).toHaveBeenCalledWith("os1", "u1", { motivo: "x" });
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
