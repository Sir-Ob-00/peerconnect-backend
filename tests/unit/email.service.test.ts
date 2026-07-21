jest.mock("../../src/config/mailer", () => ({
  mailTransporter: {
    sendMail: jest.fn(),
  },
}));

import { emailService } from "../../src/services/email.service";
import { mailTransporter } from "../../src/config/mailer";

const mockSendMail = mailTransporter.sendMail as jest.MockedFunction<typeof mailTransporter.sendMail>;

describe("emailService.sendEmail", () => {
  it("sends via the configured transporter with the expected envelope", async () => {
    mockSendMail.mockResolvedValue({} as never);

    await emailService.sendEmail({ to: "student@uni.edu.gh", subject: "Hello", html: "<p>Hi</p>" });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "student@uni.edu.gh", subject: "Hello", html: "<p>Hi</p>" })
    );
  });

  it("never throws, even when the transporter rejects", async () => {
    mockSendMail.mockRejectedValue(new Error("SMTP connection refused"));

    await expect(
      emailService.sendEmail({ to: "student@uni.edu.gh", subject: "Hello", html: "<p>Hi</p>" })
    ).resolves.toBeUndefined();
  });
});

describe("emailService.sendSessionRequestEmail", () => {
  it("sends to the receiver with both names and the skill in the content", async () => {
    mockSendMail.mockResolvedValue({} as never);

    await emailService.sendSessionRequestEmail({
      receiverEmail: "receiver@uni.edu.gh",
      receiverName: "Kwabena Owusu",
      requesterName: "Ama Mensah",
      skill: "React Native",
      scheduledDate: new Date("2026-08-01T10:00:00Z"),
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0] as { to: string; html: string; subject: string };
    expect(call.to).toBe("receiver@uni.edu.gh");
    expect(call.subject).toContain("Ama Mensah");
    expect(call.html).toContain("Kwabena Owusu");
    expect(call.html).toContain("React Native");
  });

  it("never throws even on transporter failure", async () => {
    mockSendMail.mockRejectedValue(new Error("boom"));
    await expect(
      emailService.sendSessionRequestEmail({
        receiverEmail: "receiver@uni.edu.gh",
        receiverName: "Kwabena",
        requesterName: "Ama",
        skill: "React",
        scheduledDate: new Date(),
      })
    ).resolves.toBeUndefined();
  });
});

describe("emailService.sendSessionAcceptedEmail", () => {
  it("sends to the requester with both names and the skill in the content", async () => {
    mockSendMail.mockResolvedValue({} as never);

    await emailService.sendSessionAcceptedEmail({
      requesterEmail: "requester@uni.edu.gh",
      requesterName: "Ama Mensah",
      receiverName: "Kwabena Owusu",
      skill: "React Native",
      scheduledDate: new Date("2026-08-01T10:00:00Z"),
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0] as { to: string; html: string; subject: string };
    expect(call.to).toBe("requester@uni.edu.gh");
    expect(call.subject).toContain("Kwabena Owusu");
    expect(call.html).toContain("Ama Mensah");
    expect(call.html).toContain("React Native");
  });
});
