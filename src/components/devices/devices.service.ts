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
   * Returns the number of rows updated (0 = no matching/seeded device).
   */
  async updateLocation(input: UpdateDeviceLocationInput): Promise<number> {
    const where: WhereOptions<Device> = { isActive: true };
    if (input.deviceId) {
      where.deviceId = input.deviceId;
    } else if (input.macAddress) {
      where.macAddress = input.macAddress;
    } else {
      return 0;
    }

    const [affected] = await this.deviceModel.update(
      {
        latitude: input.latitude.toFixed(6),
        longitude: input.longitude.toFixed(6),
        lastSeenAt: new Date(),
      },
      { where },
    );

    return affected;
  }
}
