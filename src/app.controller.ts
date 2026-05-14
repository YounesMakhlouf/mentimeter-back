import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller()
export class AppController {
  @ApiOperation({
    summary: "Liveness probe",
    description:
      "Public, no auth. Returns 200 with a tiny status payload.",
  })
  @Get("health")
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
