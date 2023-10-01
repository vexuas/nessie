import { formatSeasonEndCountdown } from './helpers';

//TODO: Add tests for other helpers here too eventually
describe('formatSeasonEndCountdown', () => {
  const mockEndDate = 1698771600 * 1000; //Nov 1, 2023
  const mockCurrentDate = 1696168373 * 1000; //Oct 1, 2023

  it('returns the correct format when seasonEnd and currentDate are in epoch time', () => {
    const result = formatSeasonEndCountdown({
      seasonEnd: mockEndDate,
      currentDate: mockCurrentDate,
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when seasonEnd is in Date format and currentDate is in epoch time', () => {
    const result = formatSeasonEndCountdown({
      seasonEnd: new Date(mockEndDate),
      currentDate: mockCurrentDate,
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when seasonEnd is in epoch time and currentDate is in Date format', () => {
    const result = formatSeasonEndCountdown({
      seasonEnd: mockEndDate,
      currentDate: new Date(mockCurrentDate),
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when seasonEnd and currentDate are in Date format', () => {
    const result = formatSeasonEndCountdown({
      seasonEnd: new Date(mockEndDate),
      currentDate: new Date(mockCurrentDate),
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when seasonEnd is less than a day to currentDate', () => {
    const result = formatSeasonEndCountdown({
      seasonEnd: mockEndDate,
      currentDate: 1698750279 * 1000,
    });

    expect(result).toBe('6 hours');
  });
  it('returns the correct format when seasonEnd has passed currentDate', () => {
    const result = formatSeasonEndCountdown({
      seasonEnd: new Date(mockCurrentDate - 3600000),
      currentDate: mockCurrentDate,
    });

    expect(result).toBeNull();
  });
});
