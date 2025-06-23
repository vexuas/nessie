import { format } from 'date-fns';
import { SeasonAPISchema } from '../../schemas/season';
import { formatEndDateCountdown, generateSeasonEmbed } from '../../utils/helpers';
import { inlineCode } from 'discord.js';

const mockSeasonData: SeasonAPISchema = {
  info: {
    season: 25,
    title: 'Prodigy',
    description:
      'Target greatness and get ready to shoot your shot with a new Legend that has been a prodigy since his beginnings. Set your sights on the bullseye or close enough with an explosive new Bocek. And make every strike count in a returning favorite: Arenas. Add in Ranked updates, refreshed metas, and more, and this season will definitely be kicking off with a bang (no whimpers here).',
    split: 1,
    data: {
      tagline: '\n\nTarget greatness.',
      url: 'https://www.ea.com/games/apex-legends/prodigy',
      image: 'Olympus',
    },
  },
  dates: {
    start: {
      timestamp: 1746550800,
      readable: '05-06-2025 17:00:00',
      since: 3629687,
      untilNext: 603913,
    },
    split: {
      timestamp: 1750784400,
      readable: '06-24-2025 17:00:00',
      since: 0,
      untilNext: 4232713,
    },
    end: {
      timestamp: 1754413200,
      readable: '08-05-2025 17:00:00',
      rankedEnd: 1754411400,
      rankedEndReadable: '08-05-2025 16:30:00',
    },
  },
};

describe('Season Command', () => {
  it('generates an embed correctly', () => {
    const embed = generateSeasonEmbed(mockSeasonData);

    expect(embed).not.toBeUndefined();
  });
  it('displays the correct fields in the embed', () => {
    const embed = generateSeasonEmbed(mockSeasonData);

    expect(embed).not.toBeUndefined();
    expect(embed.title).not.toBeUndefined();
    expect(embed.color).not.toBeUndefined();
    expect(embed.description).not.toBeUndefined();
    expect(embed.image).not.toBeUndefined();
    expect(embed.image?.url).not.toBeUndefined();
    expect(embed.footer).not.toBeUndefined();
    expect(embed.footer?.text).not.toBeUndefined();
    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields?.length).toBe(2);
  });
  it('displays the correct title', () => {
    const embed = generateSeasonEmbed(mockSeasonData);
    const { season, title } = mockSeasonData.info;

    expect(embed.title).toBe(`Season ${season} | ${title}`);
  });
  it('displays the correct description', () => {
    const embed = generateSeasonEmbed(mockSeasonData);
    const { split, description } = mockSeasonData.info;
    const { start } = mockSeasonData.dates;

    expect(embed.description).not.toBeUndefined();
    expect(embed.description).toContain(description);
    expect(embed.description).toContain(
      `Started on: ${inlineCode(format(start.timestamp * 1000, 'dd MMM, h:mm a'))}`
    );
    expect(embed.description).toContain(`Current Split: ${inlineCode(split.toString())}`);
  });
  //TODO: Add test for different map url once getMapUrl is tested/refactored
  it('displays the correct image url', () => {
    const embed = generateSeasonEmbed(mockSeasonData);

    expect(embed.image?.url).toBe('https://cdn.vexuas.com/nessie/apex_legends_maps/olympus.jpg');
  });
  it('displays the correct end date in the footer', () => {
    const embed = generateSeasonEmbed(mockSeasonData);
    const { end } = mockSeasonData.dates;

    expect(embed.footer?.text).toBe(
      `Season ends on ${format(end.rankedEnd * 1000, 'dd MMM, h:mm a')}`
    );
  });
  it('displays the correct countdown in the Split field', () => {
    const mockDate = new Date('2025-06-18T16:10:49.193Z');
    const embed = generateSeasonEmbed(mockSeasonData, mockDate);
    const { split } = mockSeasonData.dates;

    const splitEnd = formatEndDateCountdown({
      endDate: split.timestamp * 1000,
      currentDate: mockDate,
    });

    expect(embed.fields && embed.fields[0].name).toBe('Split ends in');
    expect(embed.fields && embed.fields[0].value).toContain(splitEnd);
  });
  it('displays the correct countdown in the Season field', () => {
    const mockDate = new Date('2025-06-18T16:10:49.193Z');
    const embed = generateSeasonEmbed(mockSeasonData, mockDate);
    const { end } = mockSeasonData.dates;

    const seasonEnd = formatEndDateCountdown({
      endDate: end.rankedEnd * 1000,
      currentDate: mockDate,
    });

    expect(embed.fields && embed.fields[1].name).toBe('Season ends in');
    expect(embed.fields && embed.fields[1].value).toContain(seasonEnd);
  });
});
