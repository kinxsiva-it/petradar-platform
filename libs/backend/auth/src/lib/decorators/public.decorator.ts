import { SetMetadata } from '@nestjs/common';

export const publicRouteMetadataKey = 'petradar:public_route';

export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(publicRouteMetadataKey, true);
