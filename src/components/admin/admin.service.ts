import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError, WhereOptions } from 'sequelize';
import {
  NodeStatus,
  ParkingNode,
} from '../../database/model/parking-node.model';
import { Zone } from '../../database/model/zone.model';
import { AttachNodeZoneDto } from './dto/attach-node-zone.dto';
import { CreateParkingNodeDto } from './dto/create-parking-node.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { ListParkingNodesQueryDto } from './dto/list-parking-nodes-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Zone)
    private readonly zoneModel: typeof Zone,
    @InjectModel(ParkingNode)
    private readonly parkingNodeModel: typeof ParkingNode,
  ) {}

  async createZone(dto: CreateZoneDto): Promise<Zone> {
    const name = this.requiredString(dto.name, 'name');
    const city = this.requiredString(dto.city, 'city');

    try {
      return await this.zoneModel.create({
        name,
        city,
        description: this.optionalString(dto.description),
        isActive: dto.isActive ?? true,
      });
    } catch (error) {
      this.handleUniqueConstraint(error, 'Zone already exists in this city');
      throw error;
    }
  }

  listZones(): Promise<Zone[]> {
    return this.zoneModel.findAll({
      order: [
        ['city', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  async getZone(id: string): Promise<Zone> {
    const zone = await this.zoneModel.findByPk(id);
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    return zone;
  }

  async listNodesByZone(zoneId: string): Promise<ParkingNode[]> {
    await this.getZone(zoneId);

    return this.parkingNodeModel.findAll({
      where: {
        zoneId,
      },
      include: [Zone],
      order: [['createdAt', 'DESC']],
    });
  }

  async createNode(dto: CreateParkingNodeDto): Promise<ParkingNode> {
    const zone = await this.getZone(this.requiredString(dto.zoneId, 'zoneId'));
    const latitude = this.decimalInRange(dto.latitude, 'latitude', -90, 90);
    const longitude = this.decimalInRange(dto.longitude, 'longitude', -180, 180);
    const status = this.parseNodeStatus(dto.status);

    try {
      return await this.parkingNodeModel.create({
        nodeUid: this.requiredString(dto.nodeUid, 'nodeUid'),
        name: this.requiredString(dto.name, 'name'),
        zoneId: zone.id,
        latitude,
        longitude,
        status,
        batteryLevel: this.optionalIntegerInRange(
          dto.batteryLevel,
          'batteryLevel',
          0,
          100,
        ),
        signalStrength: this.optionalIntegerInRange(
          dto.signalStrength,
          'signalStrength',
          -120,
          0,
        ),
        firmwareVersion: this.optionalString(dto.firmwareVersion),
        isOnline: dto.isOnline ?? false,
        lastSeenAt: this.optionalDate(dto.lastSeenAt, 'lastSeenAt'),
        installedAt: this.optionalDate(dto.installedAt, 'installedAt'),
      });
    } catch (error) {
      this.handleUniqueConstraint(error, 'Node UID already exists');
      throw error;
    }
  }

  listNodes(query: ListParkingNodesQueryDto): Promise<ParkingNode[]> {
    const where: WhereOptions<ParkingNode> = {};

    if (query.zoneId) {
      where.zoneId = query.zoneId;
    }

    if (query.status) {
      where.status = this.parseNodeStatus(query.status);
    }

    if (query.isOnline !== undefined) {
      where.isOnline = this.parseBooleanQuery(query.isOnline, 'isOnline');
    }

    return this.parkingNodeModel.findAll({
      where,
      include: [Zone],
      order: [['createdAt', 'DESC']],
    });
  }

  async getNode(id: string): Promise<ParkingNode> {
    const node = await this.parkingNodeModel.findByPk(id, {
      include: [Zone],
    });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return node;
  }

  async attachNodeToZone(
    nodeId: string,
    dto: AttachNodeZoneDto,
  ): Promise<ParkingNode> {
    const [node, zone] = await Promise.all([
      this.getNode(nodeId),
      this.getZone(this.requiredString(dto.zoneId, 'zoneId')),
    ]);

    await node.update({ zoneId: zone.id });

    return this.getNode(node.id);
  }

  private requiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }

    return value.trim();
  }

  private optionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Expected string value');
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private decimalInRange(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): string {
    const numberValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : Number.NaN;

    if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
      throw new BadRequestException(`${field} must be between ${min} and ${max}`);
    }

    return numberValue.toFixed(6);
  }

  private optionalIntegerInRange(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
    ) {
      throw new BadRequestException(`${field} must be between ${min} and ${max}`);
    }

    return value;
  }

  private optionalDate(value: unknown, field: string): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be an ISO date string`);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date string`);
    }

    return date;
  }

  private parseNodeStatus(status: unknown): NodeStatus {
    if (status === undefined || status === null) {
      return NodeStatus.Unknown;
    }

    if (
      typeof status !== 'string' ||
      !Object.values(NodeStatus).includes(status as NodeStatus)
    ) {
      throw new BadRequestException('Invalid node status');
    }

    return status as NodeStatus;
  }

  private parseBooleanQuery(value: string, field: string): boolean {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new BadRequestException(`${field} must be true or false`);
  }

  private handleUniqueConstraint(error: unknown, message: string): void {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictException(message);
    }
  }
}
