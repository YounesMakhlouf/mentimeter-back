import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { QuizSessionService } from "./quiz-session.service";
import { QuizSession } from "./entities/quiz-session.entity";
import { Quiz } from "../quizzes/entities/quiz.entity";
import { User } from "../users/entities/user.entity";

describe("QuizSessionService", () => {
  let service: QuizSessionService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const mockQuizRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizSessionService,
        { provide: getRepositoryToken(Quiz), useValue: mockQuizRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<QuizSessionService>(QuizSessionService);
    jest.clearAllMocks();
  });

  // Helper: insert a session directly into the in-memory map for tests
  // that don't need to exercise createQuiz's DB path.
  const seedSession = (overrides: Partial<QuizSession> = {}): QuizSession => {
    const code = overrides.quizCode ?? "111111";
    const session: QuizSession = {
      quiz: null as unknown as Quiz,
      quizCode: code,
      owner: null as unknown as User,
      players: [],
      ownerSocketId: "host-socket",
      ...overrides,
    };
    service.quizSessions.set(code, session);
    return session;
  };

  describe("createQuiz", () => {
    it("returns a 6-digit numeric PIN", async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: "q1", questions: [] });
      mockUserRepo.findOne.mockResolvedValue({ email: "host@x.com" });

      const code = await service.createQuiz("q1", "host@x.com", "sock-1");

      expect(code).toMatch(/^\d{6}$/);
      expect(service.quizSessions.has(code)).toBe(true);
    });

    it("retries on collision and produces a different PIN", async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ id: "q1", questions: [] });
      mockUserRepo.findOne.mockResolvedValue({ email: "host@x.com" });

      const first = await service.createQuiz("q1", "host@x.com", "sock-1");
      const second = await service.createQuiz("q2", "host@x.com", "sock-2");

      expect(first).not.toEqual(second);
      expect(service.quizSessions.size).toBe(2);
    });

    it("throws when all 100 attempts collide", async () => {
      // Saturate the map with every possible PIN. Then generateQuizCode
      // can never find a free slot and should throw.
      const saturated = new Map<string, QuizSession>();
      for (let i = 0; i < 1_000_000; i++) {
        saturated.set(i.toString().padStart(6, "0"), {} as QuizSession);
      }
      service.quizSessions = saturated;
      mockQueryBuilder.getOne.mockResolvedValue({ id: "q1", questions: [] });
      mockUserRepo.findOne.mockResolvedValue({ email: "host@x.com" });

      await expect(
        service.createQuiz("q1", "host@x.com", "sock-1"),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("joinQuiz", () => {
    it("returns false for an unknown quiz code", () => {
      expect(service.joinQuiz("999999", "sock-1", "Alice", "ax")).toBe(false);
    });

    it("adds a new player on first join", () => {
      const session = seedSession();
      expect(service.joinQuiz(session.quizCode, "sock-1", "Alice", "ax")).toBe(
        true,
      );
      expect(session.players).toHaveLength(1);
      expect(session.players[0]).toMatchObject({
        pseudo: "Alice",
        avatar: "ax",
        score: 0,
        socketId: "sock-1",
      });
    });

    it("rejects a second join with the same socketId (dedupe)", () => {
      const session = seedSession();
      service.joinQuiz(session.quizCode, "sock-1", "Alice", "ax");
      expect(
        service.joinQuiz(session.quizCode, "sock-1", "AliceAgain", "ax"),
      ).toBe(false);
      expect(session.players).toHaveLength(1);
      expect(session.players[0].pseudo).toBe("Alice"); // first wins
    });

    it("allows different socketIds even with the same pseudo", () => {
      const session = seedSession();
      service.joinQuiz(session.quizCode, "sock-1", "Alice", "ax");
      expect(service.joinQuiz(session.quizCode, "sock-2", "Alice", "bx")).toBe(
        true,
      );
      expect(session.players).toHaveLength(2);
    });
  });

  describe("processLeaderboard", () => {
    it("returns null/undefined for an unknown code", () => {
      expect(service.processLeaderboard("999999")).toBeUndefined();
    });

    it("ranks players by score descending and returns the public shape", () => {
      seedSession({
        quizCode: "222222",
        players: [
          { pseudo: "low", avatar: "a", score: 50, socketId: "s1" },
          { pseudo: "high", avatar: "b", score: 200, socketId: "s2" },
          { pseudo: "mid", avatar: "c", score: 100, socketId: "s3" },
        ],
      });

      const board = service.processLeaderboard("222222");

      expect(board).toEqual([
        { rank: 1, name: "high", score: 200, avatar: "b" },
        { rank: 2, name: "mid", score: 100, avatar: "c" },
        { rank: 3, name: "low", score: 50, avatar: "a" },
      ]);
    });
  });

  describe("findOne", () => {
    it("returns the session when present", () => {
      const session = seedSession({ quizCode: "333333" });
      expect(service.findOne("333333")).toBe(session);
    });

    it("throws NotFoundException for an unknown code", () => {
      expect(() => service.findOne("999999")).toThrow(NotFoundException);
    });
  });

  describe("cancelPendingTimer", () => {
    it("clears a pending timeout and unsets the field", () => {
      const session = seedSession({ quizCode: "444444" });
      session.pendingTimer = setTimeout(() => {
        throw new Error("should never fire");
      }, 60_000) as unknown as NodeJS.Timeout;

      service.cancelPendingTimer("444444");

      expect(session.pendingTimer).toBeUndefined();
    });

    it("is a no-op when there's no pending timer", () => {
      seedSession({ quizCode: "555555" });
      expect(() => service.cancelPendingTimer("555555")).not.toThrow();
    });

    it("is a no-op for an unknown code", () => {
      expect(() => service.cancelPendingTimer("999999")).not.toThrow();
    });
  });

  describe("remove", () => {
    it("deletes the session from the map", () => {
      seedSession({ quizCode: "666666" });
      service.remove("666666");
      expect(service.quizSessions.has("666666")).toBe(false);
    });

    it("cancels any pending timer before deletion", () => {
      const session = seedSession({ quizCode: "777777" });
      const fired = jest.fn();
      session.pendingTimer = setTimeout(
        fired,
        60_000,
      ) as unknown as NodeJS.Timeout;

      service.remove("777777");

      // Fast-forward 65s; the timer should NOT have fired because remove
      // canceled it.
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
      jest.advanceTimersByTime(65_000);
      expect(fired).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it("throws NotFoundException for an unknown code", () => {
      expect(() => service.remove("999999")).toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("returns the in-memory sessions map", () => {
      const a = seedSession({ quizCode: "888881" });
      const b = seedSession({ quizCode: "888882" });
      const all = service.findAll();
      expect(all.get("888881")).toBe(a);
      expect(all.get("888882")).toBe(b);
    });
  });
});
