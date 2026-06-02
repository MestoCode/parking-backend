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
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { literal } from 'sequelize';
import { ParkingNode } from './parking-node.model';

@Table({
  tableName: 'node_heartbeats',
  timestamps: false,
})
export class NodeHeartbeat extends Model<
  InferAttributes<NodeHeartbeat>,
  InferCreationAttributes<NodeHeartbeat>
> {
  @PrimaryKey
  @Default(literal('gen_random_uuid()'))
  @Column({
    type: DataType.UUID,
  })
  declare id: CreationOptional<string>;

  @Index
  @ForeignKey(() => ParkingNode)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'node_id',
  })
  declare nodeId: string;

  @BelongsTo(() => ParkingNode)
  declare node?: ParkingNode;

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
    type: DataType.DECIMAL(5, 2),
  })
  declare temperature: string | null;

  @Default(literal("'{}'::jsonb"))
  @AllowNull(false)
  @Column({
    type: DataType.JSONB,
  })
  declare metadata: CreationOptional<Record<string, unknown>>;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
