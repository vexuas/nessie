const { format } = require('date-fns');

exports.sendHealthLog = (data, channel) => {
  const utcStart = new Date(data.current.readableDate_start);
  const sgtStart = new Date(utcStart.getTime() + 28800000)
  const utcEnd = new Date(data.current.readableDate_end);
  const sgtEnd = new Date(utcEnd.getTime() + 28800000);

  const embed = {
    title: 'Nessie | Status Health Log',
    description: 'Requested data from API',
    color: 3066993,
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
    ]
  }
  channel.send({embeds: [embed]});
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
