import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
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

export enum DeviceType {
  Gateway = 'gateway',
  Node = 'node',
}

@Table({
  tableName: 'devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Device extends Model<
  InferAttributes<Device>,
  InferCreationAttributes<Device>
> {
  @PrimaryKey
  @Column({
    type: DataType.BIGINT,
    autoIncrement: true,
  })
  declare id: CreationOptional<string>;

  @Unique
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'device_id',
  })
  declare deviceId: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'mac_address',
  })
  declare macAddress: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'hashed_secret',
  })
  declare hashedSecret: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'next_hashed_secret',
  })
  declare nextHashedSecret: string | null;

  @Default(true)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  declare isActive: CreationOptional<boolean>;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(DeviceType)))
  declare type: DeviceType;

  @AllowNull(true)
  @Column({
    type: DataType.DECIMAL(9, 6),
  })
  declare latitude: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.DECIMAL(9, 6),
  })
  declare longitude: string | null;

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

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
    field: 'last_seen_at',
  })
  declare lastSeenAt: Date | null;
}
