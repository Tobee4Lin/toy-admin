import { APP_FILTER } from '@nestjs/core';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { CorsMiddleware } from './common/middleware/cors.middleware';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { BlogPostModule } from './modules/blog-post/blog-post.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExportModule } from './modules/export/export.module';
import { UploadModule } from './modules/upload/upload.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DocumentModule } from './modules/document/document.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    BlogPostModule,
    InquiryModule,
    DashboardModule,
    ExportModule,
    UploadModule,
    CustomerModule,
    DocumentModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: Logger,
      useValue: new Logger('App'),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
