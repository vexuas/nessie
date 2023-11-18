import { format } from 'date-fns';
import { cloneDeep } from 'lodash';
import { generateSeasonEmbed } from '.';
import { SeasonAPISchema } from '../../schemas/season';

const mockData: SeasonAPISchema = {
  info: {
    season: 19,
    title: 'Ignite',
    description:
      'Light the way with Conduit, the new support Legend whose shield-based abilities and infectious energy shine as the core of any squad.',
    split: 1,
    data: {
      tagline: 'Time to shine.',
      url: 'https://www.ea.com/games/apex-legends/ignite',
      image: 'https://cdn.jumpmaster.xyz/Bot/Legends/Banners/Conduit.png',
    },
  },
  dates: {
    start: {
      timestamp: 1698771600,
      readable: '10-31-2023 17:00:00',
      since: 1532743,
      untilNext: 2704457,
    },
    split: {
      timestamp: 1703008800,
      readable: '12-19-2023 18:00:00',
      since: 0,
      untilNext: 7542857,
    },
    end: {
      timestamp: 1707847200,
      readable: '02-13-2024 18:00:00',
      rankedEnd: 1707845400,
      rankedEndReadable: '02-13-2024 17:30:00',
    },
  },
};

describe('Season Command', () => {
  it('generates an embed correctly', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed).not.toBeUndefined();
  });
  it('displays the correct fields in the embed', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed.title).not.toBeUndefined();
    expect(embed.color).not.toBeUndefined();
    expect(embed.image).not.toBeUndefined();
    expect(embed.image?.url).not.toBeUndefined();
    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields?.length).toBe(2);
  });
  it('displays the correct title', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed.title).toBe(`Season ${mockData.info.season} | ${mockData.info.title}`);
  });
  it('displays the correct description if season description is present', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed.description).toContain(mockData.info.description);
    expect(embed.description).toContain(
      format(new Date(mockData.dates.start.readable), 'dd MMM yyyy, h:mm a')
    );
    expect(embed.description).toContain(mockData.info.split.toString());
  });
  it('displays the correct description if season description is not present', () => {
    const _mockData: SeasonAPISchema = cloneDeep(mockData);
    _mockData.info.description = undefined;

    const embed = generateSeasonEmbed(_mockData);

    expect(embed.description).not.toContain(mockData.info.description);
    expect(embed.description).toContain(
      format(new Date(mockData.dates.start.readable), 'dd MMM yyyy, h:mm a')
    );
    expect(embed.description).toContain(mockData.info.split.toString());
  });
  it('displays the correct image url', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed.image?.url).toBe(mockData.info.data.image);
  });
  it('displays the correct value in the Split End field', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed.fields && embed.fields[0].name).toBe('Split End');
    expect(embed.fields && embed.fields[0].value).toContain(
      format(new Date(mockData.dates.split.readable), 'dd MMM yyyy, h:mm a')
    );
    expect(embed.fields && embed.fields[0].value).toContain('31 days');
  });
  it('displays the correct value in the Season End field', () => {
    const embed = generateSeasonEmbed(mockData);

    expect(embed.fields && embed.fields[1].name).toBe('Season End');
    expect(embed.fields && embed.fields[1].value).toContain(
      format(new Date(mockData.dates.end.rankedEndReadable), 'dd MMM yyyy, h:mm a')
    );
    expect(embed.fields && embed.fields[1].value).toContain('87 days');
  });
});
