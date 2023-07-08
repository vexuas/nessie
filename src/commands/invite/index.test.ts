import { generateInviteEmbed } from '.';

describe('Invite Command', () => {
  it('generates an embed correctly', () => {
    const embed = generateInviteEmbed();

    expect(embed).not.toBeUndefined();
  });
  it('displays the correct fields in the embed', () => {
    const embed = generateInviteEmbed();

    expect(embed.description).not.toBeUndefined();
    expect(embed.color).not.toBeUndefined();
  });
});
