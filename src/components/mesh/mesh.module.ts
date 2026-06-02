import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { MeshController } from './mesh.controller';
import { MeshService } from './mesh.service';

@Module({
  imports: [DevicesModule],
  controllers: [MeshController],
  providers: [MeshService],
})
export class MeshModule {}
