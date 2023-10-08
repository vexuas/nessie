import { formatSeasonEndCountdown } from './helpers';

//TODO: Add tests for other helpers here too eventually
describe('formatSeasonEndCountdown', () => {
  const mockSeason = {
    info: {
      season: 18,
      title: 'Resurrection',
      split: 2,
      data: {
        tagline: 'Death is Reborn.',
        url: 'https://www.ea.com/games/apex-legends/resurrection',
        image: 'https://cdn.jumpmaster.xyz/Bot/Legends/Banners/Revenant.png',
      },
    },
    dates: {
      start: {
        timestamp: 1691514000,
        readable: '08-08-2023 17:00:00',
        since: 5221210,
        untilNext: 0,
      },
      split: {
        timestamp: 1695142800,
        readable: '09-19-2023 17:00:00',
        since: 1592410,
        untilNext: 2036390,
      },
      end: {
        timestamp: 1698771600,
        readable: '10-31-2023 17:00:00',
        rankedEnd: 1698769800,
        rankedEndReadable: '10-31-2023 16:30:00',
      },
    },
  };
  const mockCurrentDate = 1696168373 * 1000; //Oct 1, 2023

  it('returns the correct format when season end and currentDate are in epoch time', () => {
    const result = formatSeasonEndCountdown({
      season: mockSeason,
      currentDate: mockCurrentDate,
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when season end is in epoch time and currentDate is in Date format', () => {
    const result = formatSeasonEndCountdown({
      season: mockSeason,
      currentDate: new Date(mockCurrentDate),
    });

    expect(result).toBe('30 days');
  });
  it('returns the correct format when season end is less than a day to currentDate', () => {
    const result = formatSeasonEndCountdown({
      season: mockSeason,
      currentDate: 1698750279 * 1000,
    });

    expect(result).toBe('5 hours');
  });
  it('returns the correct format when currentDate has passed season end', () => {
    const result = formatSeasonEndCountdown({
      season: mockSeason,
      currentDate: (mockSeason.dates.end.rankedEnd + 360000) * 1000,
    });

    expect(result).toBeUndefined();
  });
});
