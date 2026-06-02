export class CreateZoneDto {
  name!: string;
  city!: string;
  description?: string | null;
  isActive?: boolean;
}
