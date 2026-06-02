import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParkingNode } from '../../database/model/parking-node.model';
import { Zone } from '../../database/model/zone.model';
import { InternalUserJwtAuthGuard } from '../auth/guards/internal-user-jwt-auth.guard';
import { AdminService } from './admin.service';
import { AttachNodeZoneDto } from './dto/attach-node-zone.dto';
import { CreateParkingNodeDto } from './dto/create-parking-node.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { ListParkingNodesQueryDto } from './dto/list-parking-nodes-query.dto';

@Controller('admin')
@UseGuards(InternalUserJwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('zones')
  createZone(@Body() dto: CreateZoneDto): Promise<Zone> {
    return this.adminService.createZone(dto);
  }

  @Get('zones')
  listZones(): Promise<Zone[]> {
    return this.adminService.listZones();
  }

  @Get('zones/:id')
  getZone(@Param('id') id: string): Promise<Zone> {
    return this.adminService.getZone(id);
  }

  @Get('zones/:id/nodes')
  listNodesByZone(@Param('id') id: string): Promise<ParkingNode[]> {
    return this.adminService.listNodesByZone(id);
  }

  @Post('nodes')
  createNode(@Body() dto: CreateParkingNodeDto): Promise<ParkingNode> {
    return this.adminService.createNode(dto);
  }

  @Get('nodes')
  listNodes(@Query() query: ListParkingNodesQueryDto): Promise<ParkingNode[]> {
    return this.adminService.listNodes(query);
  }

  @Get('nodes/:id')
  getNode(@Param('id') id: string): Promise<ParkingNode> {
    return this.adminService.getNode(id);
  }

  @Patch('nodes/:id/zone')
  attachNodeToZone(
    @Param('id') id: string,
    @Body() dto: AttachNodeZoneDto,
  ): Promise<ParkingNode> {
    return this.adminService.attachNodeToZone(id, dto);
  }
}
