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
});
