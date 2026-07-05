import { DomainError } from "./domain-error";
import { canTransition, nextStatus, OsTransition } from "./fluxo-estados-os";
import { NUMERO_OS_REGEX } from "./numero-os";
import { OsStatus } from "./os-status";

interface OrdemServicoProps {
	id: string | null;
	numero: string;
	clienteId: string;
	veiculoId: string;
	status: OsStatus;
}

export class OrdemServico {
	private constructor(private readonly props: OrdemServicoProps) {}

	static criar(params: { numero: string; clienteId: string; veiculoId: string }): OrdemServico {
		if (!params.clienteId) throw new DomainError("OS não pode existir sem cliente");
		if (!params.veiculoId) throw new DomainError("OS não pode existir sem veículo");
		if (!NUMERO_OS_REGEX.test(params.numero)) throw new DomainError("Número de OS inválido");
		return new OrdemServico({ id: null, ...params, status: OsStatus.RECEBIDA });
	}

	static reconstituir(props: OrdemServicoProps): OrdemServico {
		return new OrdemServico(props);
	}

	get id() {
		return this.props.id;
	}
	get numero() {
		return this.props.numero;
	}
	get clienteId() {
		return this.props.clienteId;
	}
	get veiculoId() {
		return this.props.veiculoId;
	}
	get status() {
		return this.props.status;
	}

	transicionar(transition: OsTransition): OsStatus {
		if (!canTransition(this.props.status, transition))
			throw new DomainError(`Transição '${transition}' inválida a partir do status ${this.props.status}`);
		this.props.status = nextStatus(transition);
		return this.props.status;
	}
}
