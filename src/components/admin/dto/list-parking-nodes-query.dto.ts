import { NodeStatus } from '../../../database/model/parking-node.model';

export class ListParkingNodesQueryDto {
  zoneId?: string;
  status?: NodeStatus;
  isOnline?: string;
}
