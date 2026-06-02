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
import { literal } from 'sequelize';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
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
    type: DataType.STRING(20),
    field: 'phone_number',
  })
  declare phoneNumber: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(255),
  })
  declare email: string | null;

  @Default('user')
  @AllowNull(false)
  @Column({
    type: DataType.STRING(50),
  })
  declare role: CreationOptional<string>;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(100),
    field: 'first_name',
  })
  declare firstName: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(100),
    field: 'last_name',
  })
  declare lastName: string | null;

  @Default(false)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_verified',
  })
  declare isVerified: CreationOptional<boolean>;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'refresh_token',
  })
  declare refreshToken: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'password_hash',
  })
  declare passwordHash: string | null;

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
