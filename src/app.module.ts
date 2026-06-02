import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './components/admin/admin.module';
import { AuthModule } from './components/auth/auth.module';
import { DevicesModule } from './components/devices/devices.module';
import { MeshModule } from './components/mesh/mesh.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, DevicesModule, AuthModule, AdminModule, MeshModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
