import { PrismaClient, Role, TipoDocumentoCliente } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Iniciando seed...");

	// ── Usuários ──────────────────────────────────────────────────────────────
	const usuarios = [
		//{ nome: "Admin Oficina", email: "admin@oficina.local", senha: "Admin@2024", role: Role.ADMINISTRADOR },
		{ nome: "Atendente Oficina", email: "atendente@oficina.local", senha: "Atendente@2024", role: Role.ATENDENTE },
		{ nome: "Mecânico Silva", email: "mecanico@oficina.local", senha: "Mecanico@2024", role: Role.MECANICO },
		{ nome: "Estoquista Pereira", email: "estoquista@oficina.local", senha: "Estoquista@2024", role: Role.ESTOQUISTA },
	];

	for (const u of usuarios) {
		const senhaHash = await argon2.hash(u.senha);
		await prisma.usuario.upsert({
			where: { email: u.email },
			update: {},
			create: { nome: u.nome, email: u.email, senhaHash, role: u.role },
		});
	}
	console.log("  ✔ Usuários");

	// ── Clientes ──────────────────────────────────────────────────────────────
	const joao = await prisma.cliente.upsert({
		where: { documento: "11144477735" },
		update: {},
		create: {
			nome: "João Silva",
			documento: "11144477735",
			tipoDocumento: TipoDocumentoCliente.CPF,
			email: "joao.silva@email.com",
			telefone: "(11) 98765-4321",
			endereco: "Rua das Flores, 123 - São Paulo/SP",
		},
	});

	const maria = await prisma.cliente.upsert({
		where: { documento: "52998224725" },
		update: {},
		create: {
			nome: "Maria Souza",
			documento: "52998224725",
			tipoDocumento: TipoDocumentoCliente.CPF,
			email: "maria.souza@email.com",
			telefone: "(11) 91234-5678",
			endereco: "Av. Paulista, 456 - São Paulo/SP",
		},
	});

	const empresa = await prisma.cliente.upsert({
		where: { documento: "11444777000161" },
		update: {},
		create: {
			nome: "Auto Peças XYZ Ltda",
			documento: "11444777000161",
			tipoDocumento: TipoDocumentoCliente.CNPJ,
			email: "contato@autopecasxyz.com.br",
			telefone: "(11) 3456-7890",
			endereco: "Rua Industrial, 789 - Santo André/SP",
		},
	});
	console.log("  ✔ Clientes");

	// ── Veículos ──────────────────────────────────────────────────────────────
	const veiculos = [
		{ placa: "ABC1234", marca: "Fiat", modelo: "Uno", ano: 2020, clienteId: joao.id },
		{ placa: "BRA1A23", marca: "Honda", modelo: "Civic", ano: 2022, clienteId: joao.id },
		{ placa: "XYZ9876", marca: "Volkswagen", modelo: "Golf", ano: 2019, clienteId: maria.id },
		{ placa: "DEF2D34", marca: "Ford", modelo: "Transit", ano: 2021, clienteId: empresa.id },
	];

	for (const v of veiculos) {
		await prisma.veiculo.upsert({ where: { placa: v.placa }, update: {}, create: v });
	}
	console.log("  ✔ Veículos");

	// ── Serviços ──────────────────────────────────────────────────────────────
	const servicos = [
		{
			nome: "Troca de óleo",
			descricao: "Troca de óleo do motor com filtro incluído",
			preco: 80.0,
			tempoEstimadoMin: 30,
		},
		{
			nome: "Alinhamento e balanceamento",
			descricao: "Alinhamento das rodas e balanceamento dos pneus",
			preco: 120.0,
			tempoEstimadoMin: 60,
		},
		{
			nome: "Revisão geral",
			descricao: "Revisão completa do veículo com checklist de 50 pontos",
			preco: 350.0,
			tempoEstimadoMin: 180,
		},
		{
			nome: "Troca de pastilhas de freio",
			descricao: "Substituição das pastilhas dianteiras e traseiras",
			preco: 200.0,
			tempoEstimadoMin: 90,
		},
		{
			nome: "Troca de correia dentada",
			descricao: "Substituição da correia dentada e tensor",
			preco: 450.0,
			tempoEstimadoMin: 120,
		},
	];

	for (const s of servicos) {
		await prisma.servico.upsert({ where: { nome: s.nome }, update: {}, create: s });
	}
	console.log("  ✔ Serviços");

	// ── Insumos ───────────────────────────────────────────────────────────────
	const insumos = [
		{
			codigo: "OL-5W30",
			nome: "Óleo de motor 5W-30",
			descricao: "Óleo sintético para motor",
			precoUnitario: 45.0,
			quantidadeEstoque: 50,
			estoqueMinimo: 10,
		},
		{
			codigo: "FO-001",
			nome: "Filtro de óleo",
			descricao: "Filtro de óleo universal 1.0–2.0",
			precoUnitario: 25.0,
			quantidadeEstoque: 30,
			estoqueMinimo: 5,
		},
		{
			codigo: "PF-DIANT",
			nome: "Pastilha de freio dianteira",
			descricao: "Kit pastilhas dianteiras",
			precoUnitario: 85.0,
			quantidadeEstoque: 20,
			estoqueMinimo: 4,
		},
		{
			codigo: "FA-001",
			nome: "Filtro de ar",
			descricao: "Filtro de ar para motor",
			precoUnitario: 35.0,
			quantidadeEstoque: 25,
			estoqueMinimo: 5,
		},
		{
			codigo: "CD-001",
			nome: "Correia dentada",
			descricao: "Correia dentada com tensor",
			precoUnitario: 120.0,
			quantidadeEstoque: 10,
			estoqueMinimo: 2,
		},
		{
			codigo: "VI-KIT4",
			nome: "Vela de ignição (kit 4)",
			descricao: "Kit 4 velas iridium",
			precoUnitario: 95.0,
			quantidadeEstoque: 15,
			estoqueMinimo: 3,
		},
		{
			codigo: "FB-DOT4",
			nome: "Fluido de freio DOT4",
			descricao: "Fluido de freio DOT4 500 ml",
			precoUnitario: 28.0,
			quantidadeEstoque: 40,
			estoqueMinimo: 8,
		},
		{
			codigo: "PL-PAR",
			nome: "Palheta limpador (par)",
			descricao: "Par de palhetas para para-brisa",
			precoUnitario: 40.0,
			quantidadeEstoque: 20,
			estoqueMinimo: 4,
		},
	];

	for (const i of insumos) {
		await prisma.insumo.upsert({ where: { codigo: i.codigo }, update: {}, create: i });
	}
	console.log("  ✔ Insumos");

	console.log("\n🌱 Seed concluído!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
