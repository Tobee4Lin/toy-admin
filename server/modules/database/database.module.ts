import { Module, Global } from '@nestjs/common';
import { getDatabase } from '../../database/db';

export const DATABASE_PROVIDER = 'DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_PROVIDER,
      useFactory: () => getDatabase(),
    },
  ],
  exports: [DATABASE_PROVIDER],
})
export class DatabaseModule {}
