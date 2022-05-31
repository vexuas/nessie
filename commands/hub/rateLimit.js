const { SlashCommandBuilder } = require('@discordjs/builders');
const { sendErrorLog } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { format } = require('date-fns');

module.exports = {
  data: new SlashCommandBuilder().setName('ratelimit').setDescription('Testing rate limiting'),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      const testChannelOne = nessie.channels.cache.get('978325622537453578');

      // const testChannelTwo = nessie.channels.cache.get('976863441526595644');
      // const testMessageTwo = await testChannelTwo.messages.fetch('977980466617544725');
      // await testMessageTwo.edit({ embeds: [embed] });
      const messagesToDelete = [
        '978706671012548608',
        '978706676922327140',
        '978706682962145311',
        '978706690499305545',
        '978706696513912902',
        '978706703979774023',
        '978706712192245781',
        '978706718513070160',
        '978706725085520002',
        '978706730928177162',
        '978706737077026937',
        '978706743431430234',
        '978706749395726437',
        '978706756299550740',
        '978706764935626762',
        '978706770845392976',
        '978706777992495124',
        '978706784225210468',
        '978706791875637278',
        '978706798515216454',
      ];
      let count = 0;
      const testLoop = () => {
        setTimeout(async () => {
          if (count < 20) {
            // const embed = {
            //   title: 'Testing Rate Limit',
            //   description: `Current Count: ${count}`,
            // };
            // const testMessageOne = await testChannelOne.send({ embeds: [embed] });
            // const currentTime = format(new Date(), 'h:mm:ss a');
            // // console.log(count, ' | ', currentTime);
            // console.log(testMessageOne.id.toString(), ',');
            const m = await testChannelOne.messages.fetch(messagesToDelete[count]);
            const y = await testChannelOne.messages.fetch(messagesToDelete[count + 1]);
            await m.delete();
            await y.delete();
            const currentTime = format(new Date(), 'h:mm:ss a');
            console.log(count, ' | ', currentTime);
            count += 2;
            testLoop();
          }
        }, 1670);
      };
      testLoop();

      // messagesToDelete.forEach(async (message) => {
      //   count += 1;
      //   const m = await testChannelOne.messages.fetch(message.toString());
      //   await m.delete();
      //   const currentTime = format(new Date(), 'h:mm:ss a');
      //   console.log(count, ' | ', currentTime);
      // });
      await interaction.editReply('Testing Rate Limits');
    } catch (data) {
      console.log(data);
      const uuid = uuidv4();
      await interaction.editReply('Oops got rate limited');
      const type = 'Rate Limited';
      const error = {
        message: data
          ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
          : 'Unexpected rate limit error',
      };
      await sendErrorLog({ nessie, error, type, uuid, ping: true });
    }
  },
};
