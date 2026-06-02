import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Device } from './model/device.model';
import { NodeAction } from './model/node-action.model';
import { NodeHeartbeat } from './model/node-heartbeat.model';
import { NodeStatusHistory } from './model/node-status-history.model';
import { OtpVerification } from './model/otp-verification.model';
import { ParkingNode } from './model/parking-node.model';
import { ParkingReservation } from './model/parking-reservation.model';
import { User } from './model/user.model';
import { Zone } from './model/zone.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [
        Device,
        User,
        OtpVerification,
        Zone,
        ParkingNode,
        NodeStatusHistory,
        NodeAction,
        NodeHeartbeat,
        ParkingReservation,
      ],
      synchronize: false,
      logging: false,
      dialectOptions:
        process.env.DB_SSL === 'true'
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : undefined,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
