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
import { NodeStatus, ParkingNode } from './parking-node.model';
import { User } from './user.model';

@Table({
  tableName: 'node_status_history',
  timestamps: false,
})
export class NodeStatusHistory extends Model<
  InferAttributes<NodeStatusHistory>,
  InferCreationAttributes<NodeStatusHistory>
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

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(NodeStatus)),
    field: 'old_status',
  })
  declare oldStatus: NodeStatus;

  @Index
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(NodeStatus)),
    field: 'new_status',
  })
  declare newStatus: NodeStatus;

  @Index
  @ForeignKey(() => User)
  @AllowNull(true)
  @Column({
    type: DataType.UUID,
    field: 'changed_by',
  })
  declare changedBy: string | null;

  @BelongsTo(() => User)
  declare changedByUser?: User;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(50),
  })
  declare source: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
