const { format } = require('date-fns');

//----------
/**
 * Function to send health status so that I can monitor how the status update for br pub maps is doing
 * @data - br data object
 * @channel - log channel in Nessie's Canyon (#health: 899620845436141609)
 * @isAccurate - whether the data received is up-to-date
 */
exports.sendHealthLog = (data, channel, isAccurate) => {
  const utcStart = new Date(data.current.readableDate_start);
  const sgtStart = new Date(utcStart.getTime() + 28800000)
  const utcEnd = new Date(data.current.readableDate_end);
  const sgtEnd = new Date(utcEnd.getTime() + 28800000);

  const embed = {
    title: 'Nessie | Status Health Log',
    description: 'Requested data from API',
    color: isAccurate ? 3066993 : 16776960,
    thumbnail: {
      url:
        'https://cdn.discordapp.com/attachments/889134541615292459/896698383593517066/sir_nessie.png'
    },
    fields: [
      {
        name: 'Current Map',
        value: `${codeBlock(data.current.map)} - ${codeBlock(format(sgtStart, 'hh:mm:ss aa'))}`,
      },
      {
        name: 'Next Map',
        value: `${codeBlock(data.next.map)} - ${codeBlock(format(sgtEnd, 'hh:mm:ss aa'))}`,
      },
      {
        name: 'Time left',
        value: codeBlock(data.current.remainingTimer)
      },
      {
        name: 'Requested At',
        value: codeBlock(format(new Date(), 'hh:mm:ss aa, dd MMM yyyy')),
      },
      {
        name: 'Accurate',
        value: isAccurate ? 'Yes' : 'No'
      }
    ]
  }
  isAccurate ? channel.send({ embeds: [embed] }) : channel.send({ content: '<@183444648360935424>', embeds: [embed] });
  
}
//----------
/**
 * Function to create a text into a discord code block
 * @param text - text to transform
 */
 const codeBlock = (text) => {
  return "`" + text + "`";
}
//----------
