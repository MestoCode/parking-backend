import { Body, Controller, HttpCode, Logger, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { IngestDeviceDto } from './dto/ingest-device.dto';
import { IngestResult, MeshService } from './mesh.service';

@Controller('mesh')
export class MeshController {
  private readonly logger = new Logger(MeshController.name);

  constructor(private readonly meshService: MeshService) {}

  /**
   * Unauthenticated LAN ingest endpoint the root gateway POSTs mesh payloads to.
   */
  @Post('ingest')
  @HttpCode(200)
  ingest(
    @Body() dto: IngestDeviceDto,
    @Req() request: FastifyRequest,
  ): Promise<IngestResult> {
    this.logger.log(
      `ESP32 mesh gateway payload received from ${request.ip} (deviceId=${dto.deviceId ?? '-'} mac=${dto.macAddress ?? dto.mac ?? '-'})`,
    );
    this.logger.debug(`ESP32 mesh gateway payload body: ${JSON.stringify(dto)}`);

    return this.meshService.ingestDeviceReport(dto);
  }
}
