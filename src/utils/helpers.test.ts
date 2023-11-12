import { formatEndDateCountdown, pluralize } from './helpers';

//TODO: Add tests for other helpers here too eventually
describe('formatEndDateCountdown', () => {
  const mockEndDate = 1698769800 * 1000;
  const mockCurrentDate = 1696168373 * 1000; //Oct 1, 2023

  it('returns the correct format when endDate and currentDate are in epoch time', () => {
    const result = formatEndDateCountdown({
      endDate: mockEndDate,
      currentDate: mockCurrentDate,
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when season end is in epoch time and currentDate is in Date format', () => {
    const result = formatEndDateCountdown({
      endDate: mockEndDate,
      currentDate: new Date(mockCurrentDate),
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when season end is less than a day to currentDate', () => {
    const result = formatEndDateCountdown({
      endDate: mockEndDate,
      currentDate: 1698750279 * 1000,
    });

    expect(result).toBe('5 hours');
  });
  it('returns the correct format when currentDate has passed season end', () => {
    const result = formatEndDateCountdown({
      endDate: mockEndDate,
      currentDate: (mockEndDate + 360000) * 1000,
    });

    expect(result).toBeUndefined();
  });
});

describe('pluralize', () => {
  it('returns the correct format if count is more than 1', () => {
    const result = pluralize(2, 'channel');
    expect(result).toBe('2 channels');
  });
  it('returns the correct format if count is 1', () => {
    const result = pluralize(1, 'channel');
    expect(result).toBe('1 channel');
  });
});
