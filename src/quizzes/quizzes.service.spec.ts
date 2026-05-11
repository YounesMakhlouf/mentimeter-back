import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { QuizzesService } from "./quizzes.service";
import { Quiz } from "./entities/quiz.entity";
import { User } from "../users/entities/user.entity";
import { Topics } from "./topics.enum";

describe("QuizzesService — ownership-checked mutations", () => {
  let service: QuizzesService;
  const quizRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };
  const userRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: getRepositoryToken(Quiz), useValue: quizRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
    jest.clearAllMocks();
  });

  const ownedQuiz = (id = "q1", ownerEmail = "owner@x.com"): Quiz =>
    ({
      id,
      name: "Old name",
      topic: Topics.MATH,
      user: { email: ownerEmail } as User,
    }) as Quiz;

  describe("updateQuiz", () => {
    it("404s when the quiz doesn't exist", async () => {
      quizRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuiz("missing", { name: "x" }, "owner@x.com"),
      ).rejects.toThrow(NotFoundException);
      expect(quizRepo.save).not.toHaveBeenCalled();
    });

    it("403s when the requester isn't the owner", async () => {
      quizRepo.findOne.mockResolvedValue(ownedQuiz("q1", "owner@x.com"));

      await expect(
        service.updateQuiz("q1", { name: "x" }, "intruder@x.com"),
      ).rejects.toThrow(ForbiddenException);
      expect(quizRepo.save).not.toHaveBeenCalled();
    });

    it("updates the provided fields and saves", async () => {
      const quiz = ownedQuiz();
      quizRepo.findOne.mockResolvedValue(quiz);
      quizRepo.save.mockImplementation((q) => Promise.resolve(q));

      const saved = await service.updateQuiz(
        "q1",
        { name: "New name", topic: Topics.HISTORY },
        "owner@x.com",
      );

      expect(saved.name).toBe("New name");
      expect(saved.topic).toBe(Topics.HISTORY);
      expect(quizRepo.save).toHaveBeenCalledTimes(1);
    });

    it("leaves unspecified fields alone", async () => {
      const quiz = ownedQuiz();
      quizRepo.findOne.mockResolvedValue(quiz);
      quizRepo.save.mockImplementation((q) => Promise.resolve(q));

      const saved = await service.updateQuiz(
        "q1",
        { name: "Just the name" },
        "owner@x.com",
      );

      expect(saved.name).toBe("Just the name");
      expect(saved.topic).toBe(Topics.MATH); // unchanged
    });
  });

  describe("deleteQuiz", () => {
    it("404s when the quiz doesn't exist", async () => {
      quizRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteQuiz("missing", "owner@x.com"),
      ).rejects.toThrow(NotFoundException);
      expect(quizRepo.softDelete).not.toHaveBeenCalled();
    });

    it("403s when the requester isn't the owner", async () => {
      quizRepo.findOne.mockResolvedValue(ownedQuiz("q1", "owner@x.com"));

      await expect(service.deleteQuiz("q1", "intruder@x.com")).rejects.toThrow(
        ForbiddenException,
      );
      expect(quizRepo.softDelete).not.toHaveBeenCalled();
    });

    it("calls softDelete on success", async () => {
      quizRepo.findOne.mockResolvedValue(ownedQuiz());
      quizRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteQuiz("q1", "owner@x.com");

      expect(quizRepo.softDelete).toHaveBeenCalledWith("q1");
    });
  });
});
