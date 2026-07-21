import { pushNotificationService } from "../../src/services/pushNotification.service";

describe("pushNotificationService.sendPushNotification", () => {
  it("resolves without throwing (structure only — delivery is intentionally not implemented)", async () => {
    await expect(
      pushNotificationService.sendPushNotification("user-1", "Title", "Body")
    ).resolves.toBeUndefined();
  });
});
