import { BadRequestException } from '@nestjs/common';
import {
  ANALYTICS_DEFAULT_RANGE_DAYS,
  ANALYTICS_MAX_RANGE_DAYS,
  AnalyticsRangeQuery,
} from '@restaurant-platform/shared-types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ResolvedRange {
  from: Date;
  to: Date;
}

export function resolveRange(
  query: AnalyticsRangeQuery,
  now: Date = new Date()
): ResolvedRange {
  const to = query.to ? new Date(query.to) : now;
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - ANALYTICS_DEFAULT_RANGE_DAYS * MS_PER_DAY);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestException('Invalid date in range');
  }

  if (from.getTime() >= to.getTime()) {
    throw new BadRequestException('"from" must be earlier than "to"');
  }

  const spanDays = (to.getTime() - from.getTime()) / MS_PER_DAY;
  if (spanDays > ANALYTICS_MAX_RANGE_DAYS) {
    throw new BadRequestException(
      `Range must not exceed ${ANALYTICS_MAX_RANGE_DAYS} days`
    );
  }

  return { from, to };
}
