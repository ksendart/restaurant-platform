import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  RevenueResponse,
  TopDishesResponse,
} from '@restaurant-platform/shared-types';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AnalyticsRangeDto } from './dto/analytics-range.dto';

@Controller('admin/analytics')
@Roles(['admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('revenue')
  getRevenue(@Query() query: AnalyticsRangeDto): Promise<RevenueResponse> {
    return this.adminAnalyticsService.getRevenue(query);
  }

  @Get('top-dishes')
  getTopDishes(@Query() query: AnalyticsRangeDto): Promise<TopDishesResponse> {
    return this.adminAnalyticsService.getTopDishes(query);
  }
}
