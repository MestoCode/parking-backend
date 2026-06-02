import { Controller, Get } from '@nestjs/common';
import { DevicesService, LocatedDevice } from './devices.service';

/**
 * Public, read-only view of the real mesh hardware (gateways / nodes) that have
 * reported a location. Unauthenticated on purpose: the client map is public and
 * the mesh ingest path it mirrors is also unauthenticated. No secrets are
 * exposed here — only device identity, type and coordinates.
 */
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  listLocated(): Promise<LocatedDevice[]> {
    return this.devicesService.listLocated();
  }
}
