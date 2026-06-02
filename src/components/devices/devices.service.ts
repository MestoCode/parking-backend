import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Device, DeviceType } from '../../database/model/device.model';

/**
 * A device is considered "online" only if it reported within this window.
 * Anything older (or deactivated) is treated as turned off and rendered grey
 * on the map. The gateway self-reports every ~20s, so 45s tolerates one miss.
 */
export const DEVICE_ONLINE_WINDOW_MS = 45_000;

export interface LocatedDevice {
  deviceId: string;
  type: DeviceType;
  latitude: number;
  longitude: number;
  lastSeenAt: Date | null;
  isActive: boolean;
  online: boolean;
}

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

  /**
   * Every mesh device that has reported a location, newest sighting first.
   * Powers the public map / admin "live devices" view. Inactive or stale
   * devices are still returned (flagged `online: false`) so the UI can render
   * them as "turned off" rather than dropping them. Decimal columns come back
   * as strings from Sequelize, so coordinates are normalised to numbers.
   */
  async listLocated(): Promise<LocatedDevice[]> {
    const devices = await this.deviceModel.findAll({
      where: {
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
      order: [['lastSeenAt', 'DESC']],
    });

    const now = Date.now();

    return devices.map((device) => {
      const lastSeenAt = device.lastSeenAt;
      const isFresh =
        lastSeenAt !== null &&
        now - new Date(lastSeenAt).getTime() <= DEVICE_ONLINE_WINDOW_MS;

      return {
        deviceId: device.deviceId,
        type: device.type,
        latitude: Number(device.latitude),
        longitude: Number(device.longitude),
        lastSeenAt,
        isActive: device.isActive,
        online: device.isActive && isFresh,
      };
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
   * device is deleted). When the location is unchanged it still refreshes
   * lastSeenAt so an actively-reporting device stays "online".
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
      // Coordinates are hardcoded so they never change, but the device is still
      // actively reporting. Refresh lastSeenAt (cheap single-column write) so the
      // online/offline indicator reflects that it checked in.
      device.lastSeenAt = new Date();
      await device.save({ fields: ['lastSeenAt'] });
      return { matched: true, changed: false, created: false };
    }

    device.latitude = latitude;
    device.longitude = longitude;
    device.lastSeenAt = new Date();
    await device.save();

    return { matched: true, changed: true, created: false };
  }
}
