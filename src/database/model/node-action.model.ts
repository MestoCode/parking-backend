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
import { User } from './user.model';

@Table({
  tableName: 'node_actions',
  timestamps: false,
})
export class NodeAction extends Model<
  InferAttributes<NodeAction>,
  InferCreationAttributes<NodeAction>
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

  @Index
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'user_id',
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Index
  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare action: string;

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
