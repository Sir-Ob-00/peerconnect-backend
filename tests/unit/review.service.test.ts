jest.mock("../../src/repositories/review.repository", () => ({
  reviewRepository: {
    create: jest.fn(),
    findBySessionId: jest.fn(),
    listByReceiver: jest.fn(),
    getRatingSummary: jest.fn(),
  },
}));

jest.mock("../../src/repositories/session.repository", () => ({
  sessionRepository: {
    findById: jest.fn(),
  },
}));

jest.mock("../../src/repositories/user.repository", () => ({
  userRepository: {
    findActiveById: jest.fn(),
  },
}));

import { reviewService } from "../../src/services/review.service";
import { reviewRepository } from "../../src/repositories/review.repository";
import { sessionRepository } from "../../src/repositories/session.repository";
import { userRepository } from "../../src/repositories/user.repository";

const mockReviewRepo = reviewRepository as jest.Mocked<typeof reviewRepository>;
const mockSessionRepo = sessionRepository as jest.Mocked<typeof sessionRepository>;
const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;

const REQUESTER_ID = "11111111-1111-1111-1111-111111111111";
const RECEIVER_ID = "22222222-2222-2222-2222-222222222222";
const OUTSIDER_ID = "33333333-3333-3333-3333-333333333333";
const SESSION_ID = "sess-1";

function makeSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: SESSION_ID,
    requesterId: REQUESTER_ID,
    receiverId: RECEIVER_ID,
    skill: "React Native",
    message: null,
    status: "COMPLETED",
    scheduledDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeReview(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "review-1",
    sessionId: SESSION_ID,
    reviewerId: REQUESTER_ID,
    receiverId: RECEIVER_ID,
    rating: 5,
    comment: "Great session!",
    createdAt: new Date(),
    reviewer: { id: REQUESTER_ID, firstName: "Ama", lastName: "Mensah", profileImage: null },
    ...overrides,
  };
}

describe("reviewService.createReview", () => {
  const validInput = { sessionId: SESSION_ID, rating: 5, comment: "Great session!" };

  it("throws 404 when the session doesn't exist", async () => {
    mockSessionRepo.findById.mockResolvedValue(null);
    await expect(reviewService.createReview(REQUESTER_ID, validInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when the session isn't completed", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession({ status: "ACCEPTED" }) as never);
    await expect(reviewService.createReview(REQUESTER_ID, validInput)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 403 when the caller wasn't a participant in the session", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    await expect(reviewService.createReview(OUTSIDER_ID, validInput)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 409 when the session has already been reviewed", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockReviewRepo.findBySessionId.mockResolvedValue(makeReview() as never);
    await expect(reviewService.createReview(REQUESTER_ID, validInput)).rejects.toMatchObject({ statusCode: 409 });
    expect(mockReviewRepo.create).not.toHaveBeenCalled();
  });

  it("derives the receiver as the other participant — the requester can review the receiver", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockReviewRepo.findBySessionId.mockResolvedValue(null);
    mockReviewRepo.create.mockResolvedValue(makeReview() as never);

    await reviewService.createReview(REQUESTER_ID, validInput);

    expect(mockReviewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: REQUESTER_ID, receiverId: RECEIVER_ID })
    );
  });

  it("derives the receiver as the other participant — the receiver can review the requester", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockReviewRepo.findBySessionId.mockResolvedValue(null);
    mockReviewRepo.create.mockResolvedValue(
      makeReview({ reviewerId: RECEIVER_ID, receiverId: REQUESTER_ID }) as never
    );

    await reviewService.createReview(RECEIVER_ID, validInput);

    expect(mockReviewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ reviewerId: RECEIVER_ID, receiverId: REQUESTER_ID })
    );
  });

  it("creates the review and returns it mapped", async () => {
    mockSessionRepo.findById.mockResolvedValue(makeSession() as never);
    mockReviewRepo.findBySessionId.mockResolvedValue(null);
    mockReviewRepo.create.mockResolvedValue(makeReview() as never);

    const result = await reviewService.createReview(REQUESTER_ID, validInput);

    expect(result.rating).toBe(5);
    expect(result.reviewer.id).toBe(REQUESTER_ID);
  });
});

describe("reviewService.getReviewsForUser", () => {
  it("throws 404 when the user doesn't exist", async () => {
    mockUserRepo.findActiveById.mockResolvedValue(null);
    await expect(reviewService.getReviewsForUser(RECEIVER_ID, 1, 10)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns reviews, pagination, and a rating summary computed over all reviews", async () => {
    mockUserRepo.findActiveById.mockResolvedValue({ id: RECEIVER_ID } as never);
    mockReviewRepo.listByReceiver.mockResolvedValue({ items: [makeReview()], totalItems: 12 });
    mockReviewRepo.getRatingSummary.mockResolvedValue({ averageRating: 4.666666, totalReviews: 12 });

    const result = await reviewService.getReviewsForUser(RECEIVER_ID, 1, 10);

    expect(result.reviews).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, limit: 10, totalPages: 2, totalItems: 12 });
    // Rounded to 1 decimal place for display.
    expect(result.summary).toEqual({ averageRating: 4.7, totalReviews: 12 });
  });

  it("returns a zero-review summary cleanly, not NaN", async () => {
    mockUserRepo.findActiveById.mockResolvedValue({ id: RECEIVER_ID } as never);
    mockReviewRepo.listByReceiver.mockResolvedValue({ items: [], totalItems: 0 });
    mockReviewRepo.getRatingSummary.mockResolvedValue({ averageRating: 0, totalReviews: 0 });

    const result = await reviewService.getReviewsForUser(RECEIVER_ID, 1, 10);

    expect(result.summary).toEqual({ averageRating: 0, totalReviews: 0 });
  });
});
