import { NodeStatus } from '../../../database/model/parking-node.model';

export class CreateParkingNodeDto {
  nodeUid!: string;
  name!: string;
  zoneId!: string;
  latitude!: number | string;
  longitude!: number | string;
  status?: NodeStatus;
  batteryLevel?: number | null;
  signalStrength?: number | null;
  firmwareVersion?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  installedAt?: string;
}
