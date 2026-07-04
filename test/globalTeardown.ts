import { getContainer } from "./helpers/db-container-state";

export default async function globalTeardown(): Promise<void> {
	const container = getContainer();
	if (container) {
		await container.stop();
	}
}
