import { CurrentUser } from "./current-user.decorator";

describe("CurrentUser()", () => {
	it("é uma função decorator chamável", () => {
		expect(typeof CurrentUser).toBe("function");
		const decorator = CurrentUser();
		expect(typeof decorator).toBe("function");
	});
});
