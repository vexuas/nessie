import { generateMixtapeEmbed } from '.';
import { MapRotationMixtapeSchema } from '../../schemas/mapRotation';

const mockData: MapRotationMixtapeSchema = {
  current: {
    start: 1688924700,
    end: 1688925600,
    readableDate_start: '2023-07-09 17:45:00',
    readableDate_end: '2023-07-09 18:00:00',
    map: 'Fragment',
    code: 'freedm_gungame_fragment',
    DurationInSecs: 900,
    DurationInMinutes: 15,
    isActive: true,
    eventName: 'Gun Run',
    asset: 'https://apexlegendsstatus.com/assets/maps/Worlds_Edge.png',
    remainingSecs: 240,
    remainingMins: 4,
    remainingTimer: '00:04:00',
  },
  next: {
    start: 1688925600,
    end: 1688926500,
    readableDate_start: '2023-07-09 18:00:00',
    readableDate_end: '2023-07-09 18:15:00',
    map: 'Habitat 4',
    code: 'freedm_tdm_habitat',
    DurationInSecs: 900,
    DurationInMinutes: 15,
    isActive: true,
    eventName: 'TDM',
    asset: 'https://apexlegendsstatus.com/assets/maps/Arena_Habitat.png',
  },
};

describe('Ltm Command', () => {
  it('generates an embed correctly', () => {
    const embed = generateMixtapeEmbed(mockData);

    expect(embed).not.toBeUndefined();
  });
  it('displays the correct fields in the embed', () => {
    const embed = generateMixtapeEmbed(mockData);

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
    const embed = generateMixtapeEmbed(mockData);

    expect(embed.title).toBe(mockData.current.eventName);
  });
  //TODO: Add test for different map url once getMapUrl is tested/refactored
  it('displays the correct image url', () => {
    const embed = generateMixtapeEmbed(mockData);

    expect(embed.image?.url).toBe(mockData.current.asset);
  });
  it('displays the correct map in the footer', () => {
    const embed = generateMixtapeEmbed(mockData);

    expect(embed.footer?.text).toBe(`Next Map: ${mockData.next.map}`);
  });
  //FLAKY: Figure out a better way to test dates
  it.skip('displays the correct ending time of the current map at the timestamp', () => {
    const embed = generateMixtapeEmbed(mockData);

    expect(embed.timestamp).toBe(
      new Date(Date.now() + mockData.current.remainingSecs * 1000).toISOString()
    );
  });
  it('displays the correct map in the Current Map field', () => {
    const embed = generateMixtapeEmbed(mockData);

    expect(embed.fields && embed.fields[0].name).toBe('Current map');
    expect(embed.fields && embed.fields[0].value).toContain(mockData.current.map);
  });
  //TODO: Add test for different countdown once getCountdown is tested/refactored
  it('displays the correct countdown in the Time Left field', () => {
    const embed = generateMixtapeEmbed(mockData);

    expect(embed.fields && embed.fields[1].name).toBe('Time left');
    expect(embed.fields && embed.fields[1].value).toContain('04 mins 00 secs');
  });
});
