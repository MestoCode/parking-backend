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

export enum ReservationStatus {
  Pending = 'PENDING',
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
}

@Table({
  tableName: 'parking_reservations',
  timestamps: false,
})
export class ParkingReservation extends Model<
  InferAttributes<ParkingReservation>,
  InferCreationAttributes<ParkingReservation>
> {
  @PrimaryKey
  @Default(literal('gen_random_uuid()'))
  @Column({
    type: DataType.UUID,
  })
  declare id: CreationOptional<string>;

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
  @Default(ReservationStatus.Pending)
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(ReservationStatus)),
  })
  declare status: CreationOptional<ReservationStatus>;

  @Index
  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'reserved_until',
  })
  declare reservedUntil: Date;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
