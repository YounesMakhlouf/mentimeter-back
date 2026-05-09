import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { AuthenticationService } from "./authentication.service";
import { User } from "../users/entities/user.entity";

describe("AuthenticationService", () => {
  let service: AuthenticationService;
  const userRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(() => "signed.jwt.token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("rejects when the email is already taken", async () => {
      userRepo.findOneBy.mockResolvedValue({
        id: "u1",
        email: "alice@x.com",
      });

      await expect(
        service.register({ email: "alice@x.com", password: "hunter22" }),
      ).rejects.toThrow(BadRequestException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("hashes the password (not stored plaintext) and persists the user", async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(undefined);

      await service.register({ email: "alice@x.com", password: "hunter22" });

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.email).toBe("alice@x.com");
      expect(saved.password).not.toBe("hunter22"); // hashed, not plaintext
      // bcrypt's compare confirms the hash actually matches the plaintext
      await expect(bcrypt.compare("hunter22", saved.password)).resolves.toBe(true);
    });

    it("returns { email, username } where username is the local part up to first non-alphanumeric", async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(undefined);

      const result = (await service.register({
        email: "alice123@example.com",
        password: "hunter22",
      })) as { email: string; username: string };

      expect(result).toEqual({ email: "alice123@example.com", username: "alice123" });
    });
  });

  describe("login", () => {
    const makeUser = async (email: string, password: string): Promise<User> => {
      const hashed = await bcrypt.hash(password, 10);
      return { id: "u1", email, password: hashed } as User;
    };

    it("rejects with BadRequestException when no user has that email", async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.login({ email: "ghost@x.com", password: "hunter22" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects with UnauthorizedException on wrong password (regression: was a `return` not `throw`)", async () => {
      userRepo.findOneBy.mockResolvedValue(await makeUser("alice@x.com", "hunter22"));

      await expect(
        service.login({ email: "alice@x.com", password: "WRONG_BUT_LONG_ENOUGH" }),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("returns { accessToken, username, email } on success", async () => {
      userRepo.findOneBy.mockResolvedValue(await makeUser("alice@x.com", "hunter22"));

      const out = (await service.login({
        email: "alice@x.com",
        password: "hunter22",
      })) as { accessToken: string; username: string; email: string };

      expect(jwtService.sign).toHaveBeenCalledWith({ email: "alice@x.com" });
      expect(out).toEqual({
        accessToken: "signed.jwt.token",
        username: "alice",
        email: "alice@x.com",
      });
    });
  });
});
