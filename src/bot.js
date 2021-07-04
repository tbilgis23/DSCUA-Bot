require('dotenv').config();

const { Client } = require('discord.js');
const client = new Client();
const PREFIX = '$';

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`)
});

// client.on('message', async (message) => {
//     if (message.author.bot === true) return;
//     if (message.content.startsWith(PREFIX)) {
//         const [CMD_NAME, ...args] = message.content
//         .trim()
//         .substring(PREFIX.length)
//         .split(/\s+/);

//         if (CMD_NAME === 'kick') {
//             if (!message.member.hasPermission('KICK_MEMBERS'))
//                 return message.reply('You do not have permissions to use that command.');
//             if (args.length === 0) return message.reply("Please provide an ID");
//             const member = message.guild.members.cache.get(args[0]);
//             if (member) {
//                 member
//                 .kick()
//                 .then(member => message.channel.send(`${member} was kicked.`), (err) => message.channel.send("I cannot kick that user."));
//             } else {
//                 message.channel.send("That member was not found");
//                 messag.channel.send
//             }
//         } else if (CMD_NAME === 'ban') {
//             if (!message.member.hasPermission('BAN_MEMBERS'))
//                 return message.reply('You do not have permissions to use that command.');
//             if (args.length === 0) return message.reply("Please provide an ID.");

//             try {
//                 const user = await message.guild.members.ban(args[0]);
//                 message.channel.send("User was banned successfully.");
//             } catch(err) {
//                 console.log(err);
//                 message.channel.send("An error occured, You don't have permission or the user was not found in the server.");
//             }
//         }
//     }
// });

client.on('guildMemberAdd', (member) => {
    member.send(`Hi! Welcome to the DSC ${member.user.toString()}`);
    console.log(1)
});


client.login(process.env.DISCORDJS_BOT_TOKEN);
