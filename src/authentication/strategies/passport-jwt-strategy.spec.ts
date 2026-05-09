import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtStrategy } from "./passport-jwt-strategy";
import { User } from "../../users/entities/user.entity";

describe("JwtStrategy.validate", () => {
  let strategy: JwtStrategy;
  const userRepo = { findOneBy: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: ConfigService,
          useValue: { get: () => "test-secret-very-long-string" },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  it("throws UnauthorizedException when no user matches the token's email", async () => {
    userRepo.findOneBy.mockResolvedValue(null);

    await expect(strategy.validate({ email: "ghost@x.com" })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userRepo.findOneBy).toHaveBeenCalledWith({ email: "ghost@x.com" });
  });

  it("returns the User entity (with password still on the instance — @Exclude strips it on serialization, not in memory)", async () => {
    const user = { id: "u1", email: "alice@x.com", password: "hashed" } as User;
    userRepo.findOneBy.mockResolvedValue(user);

    const result = await strategy.validate({ email: "alice@x.com" });

    expect(result).toBe(user);
    // password lives on the instance — ClassSerializerInterceptor + @Exclude
    // remove it on response, not here.
    expect((result as User).password).toBe("hashed");
  });
});
