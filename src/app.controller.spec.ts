import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = app.get<AppController>(AppController);
  });

  describe("GET /health", () => {
    it("returns { status: 'ok', timestamp: <iso string> }", () => {
      const result = controller.health();
      expect(result.status).toBe("ok");
      expect(typeof result.timestamp).toBe("string");
      expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    });
  });
});
