import { DeviceType } from '../../../database/model/device.model';

/**
 * Device-shaped payload a mesh node / gateway emits over the network
 * (forwarded by the root gateway to POST /mesh/ingest). Mirrors the
 * identity + location fields of the Device model.
 */
export class IngestDeviceDto {
  deviceId?: string;
  macAddress?: string;
  mac?: string;
  type?: DeviceType | string;
  latitude?: number | string;
  longitude?: number | string;
}
