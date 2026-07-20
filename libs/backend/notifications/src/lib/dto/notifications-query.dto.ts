import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CursorPaginationQueryDto } from '@petradar/backend/shared';

export class NotificationsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ default: 'all', enum: ['all', 'unread'] })
  @IsOptional()
  @IsIn(['all', 'unread'])
  status?: 'all' | 'unread';

}
