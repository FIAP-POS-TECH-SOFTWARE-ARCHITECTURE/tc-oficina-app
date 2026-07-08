import nodemailer from "nodemailer";
import { OsStatus } from "../../domain/os-status";
import { NotificacaoMudancaStatus } from "../../application/ports/notificador.gateway";
import { SmtpNotificadorGateway } from "./notificador.smtp.gateway";

jest.mock("nodemailer");

const sendMail = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

const notificacao: NotificacaoMudancaStatus = {
	numeroOs: "OS-2026-000001",
	statusAnterior: OsStatus.RECEBIDA,
	statusNovo: OsStatus.EM_DIAGNOSTICO,
	nomeCliente: "Fulano",
	emailCliente: "fulano@teste.dev",
};

describe("SmtpNotificadorGateway", () => {
	beforeEach(() => {
		sendMail.mockClear();
		sendMail.mockResolvedValue({ messageId: "x" });
	});

	it("envia e-mail com número da OS e novo status", async () => {
		const sut = new SmtpNotificadorGateway();
		await sut.notificarMudancaStatus(notificacao);
		expect(sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "fulano@teste.dev",
				subject: expect.stringContaining("OS-2026-000001"),
				text: expect.stringContaining("EM_DIAGNOSTICO"),
			}),
		);
	});

	it("não envia quando cliente não tem e-mail", async () => {
		const sut = new SmtpNotificadorGateway();
		await sut.notificarMudancaStatus({ ...notificacao, emailCliente: null });
		expect(sendMail).not.toHaveBeenCalled();
	});

	it("não propaga erro do transporte", async () => {
		sendMail.mockRejectedValueOnce(new Error("smtp down"));
		const sut = new SmtpNotificadorGateway();
		await expect(sut.notificarMudancaStatus(notificacao)).resolves.toBeUndefined();
	});

	describe("configuração do transporte", () => {
		const envOriginal = process.env;

		beforeEach(() => {
			process.env = { ...envOriginal };
			(nodemailer.createTransport as jest.Mock).mockClear();
		});

		afterAll(() => {
			process.env = envOriginal;
		});

		const configTransporte = () => (nodemailer.createTransport as jest.Mock).mock.calls[0][0];

		it("usa porta 1025 quando SMTP_PORT é inválida", () => {
			process.env.SMTP_PORT = "abc";
			new SmtpNotificadorGateway();
			expect(configTransporte().port).toBe(1025);
		});

		it("usa porta 1025 quando SMTP_PORT é vazia", () => {
			process.env.SMTP_PORT = "";
			new SmtpNotificadorGateway();
			expect(configTransporte().port).toBe(1025);
		});

		it("usa SMTP_PORT quando válida", () => {
			process.env.SMTP_PORT = "2525";
			new SmtpNotificadorGateway();
			expect(configTransporte().port).toBe(2525);
		});

		it("não habilita auth quando falta SMTP_PASS", () => {
			process.env.SMTP_USER = "user";
			delete process.env.SMTP_PASS;
			new SmtpNotificadorGateway();
			expect(configTransporte().auth).toBeUndefined();
		});

		it("habilita auth com SMTP_USER e SMTP_PASS presentes", () => {
			process.env.SMTP_USER = "user";
			process.env.SMTP_PASS = "senha";
			new SmtpNotificadorGateway();
			expect(configTransporte().auth).toEqual({ user: "user", pass: "senha" });
		});
	});
});
