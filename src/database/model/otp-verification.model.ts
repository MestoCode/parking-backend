import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
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

@Table({
  tableName: 'otp_verifications',
  timestamps: false,
})
export class OtpVerification extends Model<
  InferAttributes<OtpVerification>,
  InferCreationAttributes<OtpVerification>
> {
  @PrimaryKey
  @Default(literal('gen_random_uuid()'))
  @Column({
    type: DataType.UUID,
  })
  declare id: CreationOptional<string>;

  @Index
  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    field: 'phone_number',
  })
  declare phoneNumber: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(10),
  })
  declare code: string;

  @Index
  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'expires_at',
  })
  declare expiresAt: Date;

  @Default(false)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_used',
  })
  declare isUsed: CreationOptional<boolean>;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
