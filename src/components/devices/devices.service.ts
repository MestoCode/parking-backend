import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions } from 'sequelize';
import { Device, DeviceType } from '../../database/model/device.model';

/**
 * Placeholder secret for mesh-auto-provisioned devices. The /mesh/ingest path is
 * unauthenticated and never checks this value; it only exists to satisfy the
 * NOT NULL hashed_secret column. Rotate via the normal device auth flow if the
 * device later needs to authenticate elsewhere.
 */
const MESH_PLACEHOLDER_SECRET = 'mesh-ingest:no-auth';

export interface UpdateDeviceLocationInput {
  deviceId?: string | null;
  macAddress?: string | null;
  type?: DeviceType | null;
  latitude: number;
  longitude: number;
}

export interface UpdateDeviceLocationResult {
  matched: boolean;
  changed: boolean;
  created: boolean;
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
   * Matches an existing device by deviceId (preferred) or MAC address, and
   * auto-provisions the row when it is missing (so the table self-heals if a
   * device is deleted). Skips the DB write when the location is unchanged.
   */
  async updateLocation(
    input: UpdateDeviceLocationInput,
  ): Promise<UpdateDeviceLocationResult> {
    const where: WhereOptions<Device> = {};
    if (input.deviceId) {
      where.deviceId = input.deviceId;
    } else if (input.macAddress) {
      where.macAddress = input.macAddress;
    } else {
      return { matched: false, changed: false, created: false };
    }

    const latitude = input.latitude.toFixed(6);
    const longitude = input.longitude.toFixed(6);

    const device = await this.deviceModel.findOne({ where });

    if (!device) {
      // Auto-provision: we can only create when we have a stable deviceId + type.
      if (!input.deviceId || !input.type) {
        return { matched: false, changed: false, created: false };
      }
      await this.deviceModel.create({
        deviceId: input.deviceId,
        macAddress: input.macAddress ?? null,
        type: input.type,
        hashedSecret: MESH_PLACEHOLDER_SECRET,
        latitude,
        longitude,
        lastSeenAt: new Date(),
      });
      return { matched: true, changed: true, created: true };
    }

    if (device.latitude === latitude && device.longitude === longitude) {
      return { matched: true, changed: false, created: false };
    }

    device.latitude = latitude;
    device.longitude = longitude;
    device.lastSeenAt = new Date();
    await device.save();

    return { matched: true, changed: true, created: false };
  }
}
