import { Role } from "../../../../common/enums/role.enum";
import { BootstrapAdminUseCase } from "./bootstrap-admin.use-case";

const gateway = { contarAdminsAtivos: jest.fn(), buscarPorEmail: jest.fn(), criar: jest.fn() };
const hasher = { hash: jest.fn(), verificar: jest.fn() };

describe("BootstrapAdminUseCase", () => {
	beforeEach(() => jest.clearAllMocks());

	const useCase = () => new BootstrapAdminUseCase(gateway as any, hasher);

	it("não cria se já existe admin", async () => {
		gateway.contarAdminsAtivos.mockResolvedValueOnce(1);
		await useCase().execute();
		expect(gateway.criar).not.toHaveBeenCalled();
	});

	it("não cria admin quando email bootstrap já existe no banco", async () => {
		gateway.contarAdminsAtivos.mockResolvedValueOnce(0);
		process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@oficina.local";
		process.env.ADMIN_BOOTSTRAP_PASSWORD = "ChangeMe!123";
		gateway.buscarPorEmail.mockResolvedValueOnce({ id: "existing" });
		await useCase().execute();
		expect(gateway.criar).not.toHaveBeenCalled();
	});

	it("não cria admin e loga warn quando env vars ausentes", async () => {
		gateway.contarAdminsAtivos.mockResolvedValueOnce(0);
		const savedEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
		const savedPwd = process.env.ADMIN_BOOTSTRAP_PASSWORD;
		delete process.env.ADMIN_BOOTSTRAP_EMAIL;
		delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
		try {
			const uc = useCase();
			const warnSpy = jest.spyOn((uc as any).logger, "warn").mockImplementation(() => undefined);
			await uc.execute();
			expect(gateway.criar).not.toHaveBeenCalled();
			expect(warnSpy).toHaveBeenCalled();
		} finally {
			if (savedEmail !== undefined) process.env.ADMIN_BOOTSTRAP_EMAIL = savedEmail;
			if (savedPwd !== undefined) process.env.ADMIN_BOOTSTRAP_PASSWORD = savedPwd;
		}
	});

	it("cria admin com senha hasheada pelo port", async () => {
		gateway.contarAdminsAtivos.mockResolvedValueOnce(0);
		gateway.buscarPorEmail.mockResolvedValueOnce(null);
		process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@oficina.local";
		process.env.ADMIN_BOOTSTRAP_PASSWORD = "ChangeMe!123";
		hasher.hash.mockResolvedValueOnce("hash-bootstrap");
		gateway.criar.mockResolvedValueOnce({});
		await useCase().execute();
		expect(hasher.hash).toHaveBeenCalledWith("ChangeMe!123");
		expect(gateway.criar).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "admin@oficina.local",
				senhaHash: "hash-bootstrap",
				role: Role.ADMINISTRADOR,
			}),
		);
	});
});
