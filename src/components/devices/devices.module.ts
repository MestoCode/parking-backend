import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Device } from '../../database/model/device.model';
import { DevicesService } from './devices.service';

@Module({
  imports: [SequelizeModule.forFeature([Device])],
  providers: [DevicesService],
  exports: [SequelizeModule, DevicesService],
})
export class DevicesModule {}
