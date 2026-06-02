import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ParkingNode } from '../../database/model/parking-node.model';
import { User } from '../../database/model/user.model';
import { Zone } from '../../database/model/zone.model';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, SequelizeModule.forFeature([Zone, ParkingNode, User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
