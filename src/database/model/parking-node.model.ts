import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { literal } from 'sequelize';
import { Zone } from './zone.model';

export enum NodeStatus {
  Available = 'AVAILABLE',
  Occupied = 'OCCUPIED',
  Offline = 'OFFLINE',
  Maintenance = 'MAINTENANCE',
  Reserved = 'RESERVED',
  Unknown = 'UNKNOWN',
}

@Table({
  tableName: 'parking_nodes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ParkingNode extends Model<
  InferAttributes<ParkingNode>,
  InferCreationAttributes<ParkingNode>
> {
  @PrimaryKey
  @Default(literal('gen_random_uuid()'))
  @Column({
    type: DataType.UUID,
  })
  declare id: CreationOptional<string>;

  @Unique
  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    field: 'node_uid',
  })
  declare nodeUid: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare name: string;

  @Index
  @ForeignKey(() => Zone)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'zone_id',
  })
  declare zoneId: string;

  @BelongsTo(() => Zone)
  declare zone?: Zone;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(9, 6),
  })
  declare latitude: string;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(9, 6),
  })
  declare longitude: string;

  @Index
  @Default(NodeStatus.Unknown)
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(NodeStatus)),
  })
  declare status: CreationOptional<NodeStatus>;

  @AllowNull(true)
  @Column({
    type: DataType.SMALLINT,
    field: 'battery_level',
  })
  declare batteryLevel: number | null;

  @AllowNull(true)
  @Column({
    type: DataType.SMALLINT,
    field: 'signal_strength',
  })
  declare signalStrength: number | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(50),
    field: 'firmware_version',
  })
  declare firmwareVersion: string | null;

  @Index
  @Default(false)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_online',
  })
  declare isOnline: CreationOptional<boolean>;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
    field: 'last_seen_at',
  })
  declare lastSeenAt: Date | null;

  @Default(literal('NOW()'))
  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'installed_at',
  })
  declare installedAt: CreationOptional<Date>;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: CreationOptional<Date>;
}
