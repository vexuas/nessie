import { formatEndDateCountdown, getMapUrl, pluralize } from './helpers';

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

describe('getMapUrl', () => {
  it('returns the correct url when map_code is kings_canyon_rotation', () => {
    const result = getMapUrl('kings_canyon_rotation');
    expect(result).toBe('https://vexuas.b-cdn.net/apex_legend_maps/kings_canyon.jpg');
  });
  it('returns the correct url when map_code is worlds_edge_rotation', () => {
    const result = getMapUrl('worlds_edge_rotation');
    expect(result).toBe('https://vexuas.b-cdn.net/apex_legend_maps/worlds_edge.jpg');
  });
  it('returns the correct url when map_code is olympus_rotation', () => {
    const result = getMapUrl('olympus_rotation');
    expect(result).toBe('https://vexuas.b-cdn.net/apex_legend_maps/olympus.jpg');
  });
  it('returns the correct url when map_code is storm_point_rotation', () => {
    const result = getMapUrl('storm_point_rotation');
    expect(result).toBe('https://vexuas.b-cdn.net/apex_legend_maps/storm_point.jpg');
  });
  it('returns the correct url when map_code is broken_moon_rotation', () => {
    const result = getMapUrl('broken_moon_rotation');
    expect(result).toBe('https://vexuas.b-cdn.net/apex_legend_maps/broken_moon.jpg');
  });
  it('returns the correct url when map_code is edistrict_rotation', () => {
    const result = getMapUrl('edistrict_rotation');
    expect(result).toBe('https://vexuas.b-cdn.net/apex_legend_maps/e-district.png');
  });
  it('returns null when map_code is not any of the maps', () => {
    const result = getMapUrl('some_map');
    expect(result).toBeNull();
  });
});
