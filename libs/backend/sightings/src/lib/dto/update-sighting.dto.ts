import { PartialType } from '@nestjs/swagger';

import { CreateSightingDto } from './create-sighting.dto.js';

export class UpdateSightingDto extends PartialType(CreateSightingDto) {}
