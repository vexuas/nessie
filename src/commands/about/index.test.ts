import { generateAboutEmbed } from '.';
import { BOT_UPDATED_AT, BOT_VERSION } from '../../version';

describe('About Command', () => {
  it('generates an embed correctly', () => {
    const embed = generateAboutEmbed();

    expect(embed).not.toBeUndefined();
  });
  it('displays the correct fields in the embed', () => {
    const embed = generateAboutEmbed();

    expect(embed.title).not.toBeUndefined();
    expect(embed.description).not.toBeUndefined();
    expect(embed.color).not.toBeUndefined();
    expect(embed.thumbnail).not.toBeUndefined();
    expect(embed.thumbnail && embed.thumbnail.url).not.toBeUndefined();
    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields && embed.fields.length).toBe(6);
  });
  it('displays the correct description', () => {
    const embed = generateAboutEmbed();

    expect(embed).not.toBeUndefined();
    expect(embed.description).not.toBeUndefined();
  });
  it('dispays the correct Date Created field if client is not passed in', () => {
    const embed = generateAboutEmbed();

    expect(embed).not.toBeUndefined();
    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields && embed.fields[1].name).toBe('Date Created');
    expect(embed.fields && embed.fields[1].value).toBe('N/A');
  });
  it('displays the correct bot version', () => {
    const embed = generateAboutEmbed();

    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields && embed.fields[2].name).toBe('Version');
    expect(embed.fields && embed.fields[2].value).toBe(BOT_VERSION);
  });
  it('displays the correct Last Updated field', () => {
    const embed = generateAboutEmbed();

    expect(embed).not.toBeUndefined();
    expect(embed.fields).not.toBeUndefined();
    expect(embed.fields && embed.fields[4].name).toBe('Last Updated');
    expect(embed.fields && embed.fields[4].value).toBe(BOT_UPDATED_AT);
  });
});
