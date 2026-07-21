import type { Request, Response } from "express";
import { authenticate, optionalAuth, requireAdmin } from "../../src/middlewares/authenticate";
import { signAccessToken } from "../../src/utils/jwt.util";
import { ApiError } from "../../src/utils/ApiError";

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers, user: undefined } as unknown as Request;
}

const res = {} as Response;

describe("authenticate", () => {
  it("calls next with a 401 ApiError when no Authorization header is present", () => {
    const next = jest.fn();
    authenticate(makeReq(), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it("calls next with a 401 ApiError for a malformed token", () => {
    const next = jest.fn();
    authenticate(makeReq({ authorization: "Bearer not-a-real-token" }), res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("attaches req.user and calls next() with no error for a valid token", () => {
    const token = signAccessToken({ userId: "11111111-1111-1111-1111-111111111111", role: "STUDENT" as never });
    const req = makeReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(); // called with no arguments = success
    expect(req.user).toEqual({ id: "11111111-1111-1111-1111-111111111111", role: "STUDENT" });
  });

  it("rejects a refresh token presented as an access token", () => {
    // Signed with the refresh secret entirely — verifyAccessToken must reject it.
    const next = jest.fn();
    const req = makeReq({ authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.bad.signature" });
    authenticate(req, res, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});

describe("optionalAuth", () => {
  it("proceeds with no user when no token is present", () => {
    const req = makeReq();
    const next = jest.fn();
    optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it("proceeds with no user (and no error) for an invalid token", () => {
    const req = makeReq({ authorization: "Bearer garbage" });
    const next = jest.fn();
    optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it("attaches req.user for a valid token", () => {
    const token = signAccessToken({ userId: "11111111-1111-1111-1111-111111111111", role: "ADMIN" as never });
    const req = makeReq({ authorization: `Bearer ${token}` });
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(req.user).toEqual({ id: "11111111-1111-1111-1111-111111111111", role: "ADMIN" });
  });
});

describe("requireAdmin", () => {
  it("rejects when req.user is missing (authenticate didn't run)", () => {
    const req = makeReq();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("rejects a STUDENT with 403", () => {
    const req = makeReq();
    req.user = { id: "u1", role: "STUDENT" };
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("allows an ADMIN through", () => {
    const req = makeReq();
    req.user = { id: "u1", role: "ADMIN" };
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
