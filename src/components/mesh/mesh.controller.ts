import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IngestDeviceDto } from './dto/ingest-device.dto';
import { IngestResult, MeshService } from './mesh.service';

@Controller('mesh')
export class MeshController {
  constructor(private readonly meshService: MeshService) {}

  /**
   * Unauthenticated LAN ingest endpoint the root gateway POSTs mesh payloads to.
   */
  @Post('ingest')
  @HttpCode(200)
  ingest(@Body() dto: IngestDeviceDto): Promise<IngestResult> {
    return this.meshService.ingestDeviceReport(dto);
  }
}
