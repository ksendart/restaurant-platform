import { BadRequestException } from '@nestjs/common';
import { resolveRange } from './range';

const NOW = new Date('2026-06-06T12:00:00.000Z');

describe('resolveRange', () => {
  it('defaults to last 7 days when both bounds are missing', () => {
    const { from, to } = resolveRange({}, NOW);

    expect(to).toEqual(NOW);
    expect(to.getTime() - from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('respects explicit from/to', () => {
    const { from, to } = resolveRange(
      { from: '2026-06-01T00:00:00.000Z', to: '2026-06-04T00:00:00.000Z' },
      NOW
    );

    expect(from.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-06-04T00:00:00.000Z');
  });

  it('rejects range greater than 90 days', () => {
    expect(() =>
      resolveRange(
        { from: '2026-01-01T00:00:00.000Z', to: '2026-06-01T00:00:00.000Z' },
        NOW
      )
    ).toThrow(BadRequestException);
  });

  it('rejects "from" not earlier than "to"', () => {
    expect(() =>
      resolveRange(
        { from: '2026-06-05T00:00:00.000Z', to: '2026-06-05T00:00:00.000Z' },
        NOW
      )
    ).toThrow(BadRequestException);
  });
});
