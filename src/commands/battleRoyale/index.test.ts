import { MapRotationBattleRoyaleSchema } from '../../schemas/mapRotation';
import { generatePubsEmbed } from '../../utils/helpers';

const mockData: MapRotationBattleRoyaleSchema = {
  current: {
    start: 1689004800,
    end: 1689008400,
    readableDate_start: '2023-07-10 16:00:00',
    readableDate_end: '2023-07-10 17:00:00',
    map: "World's Edge",
    code: 'worlds_edge_rotation',
    DurationInSecs: 3600,
    DurationInMinutes: 60,
    asset: 'https://apexlegendsstatus.com/assets/maps/Worlds_Edge.png',
    remainingSecs: 1032,
    remainingMins: 17,
    remainingTimer: '00:17:12',
  },
  next: {
    start: 1689008400,
    end: 1689013800,
    readableDate_start: '2023-07-10 17:00:00',
    readableDate_end: '2023-07-10 18:30:00',
    map: 'Storm Point',
    code: 'storm_point_rotation',
    DurationInSecs: 5400,
    DurationInMinutes: 90,
    asset: 'https://apexlegendsstatus.com/assets/maps/Storm_Point.png',
  },
};

describe('Battle Royale Pubs Command', () => {
  it('generates an embed correctly', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed).not.toBeUndefined();
  });
  it('displays the correct fields in the embed', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.title).not.toBeUndefined();
    expect(embed.color).not.toBeUndefined();
    expect(embed.image).not.toBeUndefined();
    expect(embed.image?.url).not.toBeUndefined();
    expect(embed.footer).not.toBeUndefined();
    expect(embed.footer?.text).not.toBeUndefined();
    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields?.length).toBe(2);
    expect(embed.timestamp).not.toBeUndefined();
  });
  it('displays the correct title', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.title).toBe('Battle Royale | Pubs');
  });
  //TODO: Add test for different map url once getMapUrl is tested/refactored
  it('displays the correct image url', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.image?.url).toBe(
      'https://cdn.discordapp.com/attachments/896544134813319168/896544195488129034/worlds_edge.jpg'
    );
  });
  it('displays the correct map in the footer', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.footer?.text).toBe(`Next Map: ${mockData.next.map}`);
  });
  it('displays the correct ending time of the current map at the timestamp', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.timestamp).toBe(
      new Date(Date.now() + mockData.current.remainingSecs * 1000).toISOString()
    );
  });
  it('displays the correct map in the Current Map field', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.fields && embed.fields[0].name).toBe('Current map');
    expect(embed.fields && embed.fields[0].value).toContain(mockData.current.map);
  });
  //TODO: Add test for different countdown once getCountdown is tested/refactored
  it('displays the correct countdown in the Time Left field', () => {
    const embed = generatePubsEmbed(mockData);

    expect(embed.fields && embed.fields[1].name).toBe('Time left');
    expect(embed.fields && embed.fields[1].value).toContain('17 mins 12 secs');
  });
});
