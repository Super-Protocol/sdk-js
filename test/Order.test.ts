import Order from "../src/models/Order";

describe("Order", () => {
    test("throws error for non-existing order", async () => {
        const order = new Order("testNonExistingOrder");

        await expect(order.getOrderInfo()).rejects.toThrowError("Order testNonExistingOrder does not exist");
    });
});
