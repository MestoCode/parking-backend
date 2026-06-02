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
  UpdatedAt,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { literal } from 'sequelize';

@Table({
  tableName: 'zones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Zone extends Model<
  InferAttributes<Zone>,
  InferCreationAttributes<Zone>
> {
  @PrimaryKey
  @Default(literal('gen_random_uuid()'))
  @Column({
    type: DataType.UUID,
  })
  declare id: CreationOptional<string>;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare name: string;

  @Index
  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
  })
  declare city: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
  })
  declare description: string | null;

  @Index
  @Default(true)
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  declare isActive: CreationOptional<boolean>;

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
