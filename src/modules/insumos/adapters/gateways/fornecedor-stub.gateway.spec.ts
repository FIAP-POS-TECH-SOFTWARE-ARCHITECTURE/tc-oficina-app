import { FornecedorStubGateway } from "./fornecedor-stub.gateway";

describe("FornecedorStubGateway", () => {
	let gateway: FornecedorStubGateway;

	beforeEach(() => {
		gateway = new FornecedorStubGateway();
	});

	it("aprova compras com quantidade <= 50", () => {
		const r = gateway.enviarCompra({ registroCompraId: "rc1", insumoCodigo: "P-001", quantidadeSolicitada: 10 });
		expect(r.aprovado).toBe(true);
		expect(r.codigo).toBe("APROVADO_STUB");
		expect(r.payload).toMatchObject({
			registroCompraId: "rc1",
			insumoCodigo: "P-001",
			quantidadeSolicitada: 10,
			origem: "fornecedor_stub",
		});
	});

	it("aprova exatamente 50 (borda)", () => {
		const r = gateway.enviarCompra({ registroCompraId: "rc1", insumoCodigo: "P-001", quantidadeSolicitada: 50 });
		expect(r.aprovado).toBe(true);
	});

	it("recusa quantidade > 50", () => {
		const r = gateway.enviarCompra({ registroCompraId: "rc1", insumoCodigo: "P-001", quantidadeSolicitada: 51 });
		expect(r.aprovado).toBe(false);
		expect(r.codigo).toBe("RECUSADO_STUB");
		expect(r.mensagem).toContain("recusada");
	});
});
