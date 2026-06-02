import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { IngestDeviceDto } from './dto/ingest-device.dto';

export interface IngestResult {
  matched: boolean;
  deviceId: string | null;
}

@Injectable()
export class MeshService {
  private readonly logger = new Logger(MeshService.name);

  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Accept a device-shaped mesh payload and persist its hardcoded location.
   * Tolerant by design: payloads without coordinates are acknowledged and
   * ignored (e.g. ack / announcement frames), so the gateway never error-loops.
   */
  async ingestDeviceReport(dto: IngestDeviceDto): Promise<IngestResult> {
    const deviceId = this.optionalString(dto.deviceId);
    const macAddress = this.optionalString(dto.macAddress ?? dto.mac);

    if (dto.latitude === undefined || dto.longitude === undefined) {
      return { matched: false, deviceId: deviceId ?? null };
    }

    const latitude = this.coordinate(dto.latitude, 'latitude', -90, 90);
    const longitude = this.coordinate(dto.longitude, 'longitude', -180, 180);

    if (!deviceId && !macAddress) {
      throw new BadRequestException('deviceId or macAddress is required');
    }

    const affected = await this.devicesService.updateLocation({
      deviceId,
      macAddress,
      latitude,
      longitude,
    });

    if (affected === 0) {
      this.logger.warn(
        `Location report for unknown device (deviceId=${deviceId ?? '-'} mac=${macAddress ?? '-'}) — seed it in the devices table to persist.`,
      );
    } else {
      this.logger.log(
        `Updated location for ${deviceId ?? macAddress} -> ${latitude}, ${longitude}`,
      );
    }

    return { matched: affected > 0, deviceId: deviceId ?? null };
  }

  private optionalString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private coordinate(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number {
    const num =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;

    if (!Number.isFinite(num) || num < min || num > max) {
      throw new BadRequestException(`${field} must be between ${min} and ${max}`);
    }

    return num;
  }
}
