import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions } from 'sequelize';
import { Device } from '../../database/model/device.model';

export interface UpdateDeviceLocationInput {
  deviceId?: string | null;
  macAddress?: string | null;
  latitude: number;
  longitude: number;
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device)
    private readonly deviceModel: typeof Device,
  ) {}

  findActiveByDeviceId(deviceId: string): Promise<Device | null> {
    return this.deviceModel.findOne({
      where: {
        deviceId,
        isActive: true,
      },
    });
  }

  async updateLastSeen(deviceId: string): Promise<void> {
    await this.deviceModel.update(
      { lastSeenAt: new Date() },
      {
        where: {
          deviceId,
          isActive: true,
        },
      },
    );
  }

  /**
   * Persist the hardcoded coordinates a mesh device reports over the network.
   * Matches an existing active device by deviceId (preferred) or MAC address.
   * Skips the DB write entirely when the location is unchanged (saves writes).
   */
  async updateLocation(
    input: UpdateDeviceLocationInput,
  ): Promise<{ matched: boolean; changed: boolean }> {
    const where: WhereOptions<Device> = { isActive: true };
    if (input.deviceId) {
      where.deviceId = input.deviceId;
    } else if (input.macAddress) {
      where.macAddress = input.macAddress;
    } else {
      return { matched: false, changed: false };
    }

    const device = await this.deviceModel.findOne({ where });
    if (!device) {
      return { matched: false, changed: false };
    }

    const latitude = input.latitude.toFixed(6);
    const longitude = input.longitude.toFixed(6);

    if (device.latitude === latitude && device.longitude === longitude) {
      return { matched: true, changed: false };
    }

    device.latitude = latitude;
    device.longitude = longitude;
    device.lastSeenAt = new Date();
    await device.save();

    return { matched: true, changed: true };
  }
}
