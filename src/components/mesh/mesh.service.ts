import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DeviceType } from '../../database/model/device.model';
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
      this.logger.debug(
        `ESP32 mesh payload ignored because coordinates are missing (deviceId=${deviceId ?? '-'} mac=${macAddress ?? '-'})`,
      );
      return { matched: false, deviceId: deviceId ?? null };
    }

    const latitude = this.coordinate(dto.latitude, 'latitude', -90, 90);
    const longitude = this.coordinate(dto.longitude, 'longitude', -180, 180);

    if (!deviceId && !macAddress) {
      this.logger.warn(
        `ESP32 mesh payload rejected because deviceId and macAddress are missing (latitude=${latitude} longitude=${longitude})`,
      );
      throw new BadRequestException('deviceId or macAddress is required');
    }

    const { matched, changed, created } =
      await this.devicesService.updateLocation({
        deviceId,
        macAddress,
        type: this.deviceType(dto.type),
        latitude,
        longitude,
      });

    if (created) {
      this.logger.log(
        `Auto-provisioned device ${deviceId ?? macAddress} -> ${latitude}, ${longitude}`,
      );
    } else if (!matched) {
      this.logger.warn(
        `Location report for unknown device (deviceId=${deviceId ?? '-'} mac=${macAddress ?? '-'}) - send a valid type to auto-provision.`,
      );
    } else if (changed) {
      this.logger.log(
        `Updated location for ${deviceId ?? macAddress} -> ${latitude}, ${longitude}`,
      );
    } else {
      this.logger.debug(
        `Location unchanged for ${deviceId ?? macAddress} - skipped write`,
      );
    }

    return { matched, deviceId: deviceId ?? null };
  }

  private deviceType(value: unknown): DeviceType | null {
    return value === DeviceType.Gateway || value === DeviceType.Node
      ? value
      : null;
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
