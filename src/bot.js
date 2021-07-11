require('dotenv').config();

const { Client, MessageEmbed, Message, MessageCollector, DMChannel } = require('discord.js');
const client = new Client();
const mongoose = require("mongoose");
const { google } = require("calendar-link");
const Event = require("./schemas/MessageSchema");
const { DateTime } = require('luxon');
const ObjectId = require('mongoose').Types.ObjectId;


mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true })
    .then((m)=> console.log("connected to MongoDB"));

checkForPosts()

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`)
})

client.on('message', async (message) => {
    // console.log(message.attachments.first().attachment)
    if (message.author.bot === true) return;
    const filter = (m) => 
        m.author.id === message.author.id
    if (message.content.toLowerCase() === '$event') {
        if (!message.member.hasPermission("MANAGE_CHANNELS")) return
        
        let channelQ = new MessageEmbed()
        .setFooter('Please enter a number.')
        .addFields(
            {name: 'Which channel do you want to post this event on?',
            value: "**1** In the current channel\n**2** In another channel"});
        // Sends the first question after the user asks to create the event.
        await message.author.send(channelQ)
        
        // Gets the answer for the channel option.
        const channelAns = await message.author.dmChannel.awaitMessages(filter, { max:1, time: 120000 })
        .then((collected) => { return collected.first().content }).catch( (err) => {return 0})
        
        if (channelAns == 1) {
            var eventChannel = message.channel.id
        } else if (channelAns == 2) {
            let channelQ2 = new MessageEmbed()
            .addFields(
                {name: 'Enter the Channel name',
                value: "Please use case-specific characters for a unique match."});
            await message.author.send(channelQ2);
            // Asks the channel name the user wants to send.
            const channelName = await message.author.dmChannel.awaitMessages(filter, { max:1, time: 120000})
            .then(collected => {return String(collected.first().content)}).catch((err) => {return 0})
            // Checks to see if the user entered a valid channel name and sets the eventChannel variable. 
            if (message.guild.channels.cache.find((val) => {if (val.name == channelName) {return val}})) {
                var eventChannel = await message.guild.channels.cache.find((val) => {if (val.name == channelName) {return val}})
                eventChannel = eventChannel.id
            } else {
                message.author.send("Channel does not exist or you were AFK. Please repeat the process from start.")
                return
            }
        } else {
            message.author.send("Either you were AFK or you sent the wrong option. Please repeat the process from start.")
            return
        }
        
        
        let titleQ = new MessageEmbed()
            .addFields(
                {name: "What is the name of the event?",
                value: "Less than 250 characters.\n\n Type `exit` to cancel the event."})
        message.author.send(titleQ)

        const eventTitle = await message.author.dmChannel.awaitMessages(filter, { max: 1, time: 120000 })
                .then(collected => {return collected.first().content}).catch(err => {return false})
        if (!eventTitle || eventTitle.toLowerCase() === 'exit') {
            message.author.send("Either you were AFK or you cancelled the event. Let's try again later.")
            return
        }
        
        
        let descriptionQ = new MessageEmbed()
            .addFields(
                {name: "Add a description for your event",
                value: "Less than 4096 characters.\n\n Type `exit` to cancel the event."})
        message.author.send(descriptionQ)

        const eventDescription = await message.author.dmChannel.awaitMessages(filter, { max: 1, time: 120000 })
                .then(collected => {return collected.first().content}).catch(err => {return false})
        if (!eventDescription || eventDescription.toLowerCase() === 'exit') {
            message.author.send("Either you were AFK or you cancelled the event. Let's try again later.")
            return
        }
        
        
        let timeQ = new MessageEmbed()
            .addFields(
                {name: "What is the date and time of the event?",
                value: "Please enter the date and time with the following format:\n `Yr/Mo/Day Hr:Min`\nPlease use military time aka 24-hour time\nTime is based on Phoenix/AZ time."})
        message.author.send(timeQ)
        
        const eventTimeAns = await message.author.dmChannel.awaitMessages(filter, { max: 1, time: 120000})
            .then(collected => {return String(collected.first().content)}).catch( () => {return 0});
        if (eventTimeAns === 0) {
            message.author.send("Seems like you were AFK for a bit.")
            return
        }
        try {  
            // Creating the date object with the given time from the user.
            const eventDateOld = eventTimeAns.split(" ")[0].split('/')
            const eventTime = eventTimeAns.split(' ')[1].split(':')
            const [Year, Month, Day] = eventDateOld
            const [Hour, Min] = eventTime
            var eventDate = DateTime.fromObject({year: Year, month: Month, day: Day, hour: Hour, minute: Min}, {zone: 'America/Phoenix'})
        } catch(err) {
            message.author.send("Something was wrong with your date format. Please start again.")
            return
        }

        let durationQ = new MessageEmbed()
            .addFields(
                {name: "How long is the event?",
                value: "Please enter the duration of the event in the following format:\n `2 hours`, `15 minutes`, `1.5 hours`"})
        message.author.send(durationQ)
        
        const eventDurationAns = await message.author.dmChannel.awaitMessages(filter, { max: 1, time: 120000})
            .then(collected => {return String(collected.first().content)}).catch( () => {return 0});
        if (eventDurationAns == 0) {
            message.author.send("Seems like you were afk for a bit")
            return
        }
        const eventDuration = [parseInt(eventDurationAns.split(' ')[0]), eventDurationAns.split(' ')[1]]

        const eventImageQ = new MessageEmbed()
            .addFields({name: "Image of the Event", value: "Please upload a picture of this event here."})
        message.author.send(eventImageQ)

        const eventImageAns = await message.author.dmChannel.awaitMessages(filter, {max: 1, time: 120000, })
        .then(async collected => {const image1 = await collected.first()
            const image2 = await image1.attachments.first().url
        return image2}).catch( (err) => {console.log(err)});
        if (eventImageAns == 0) {
            message.author.send("Seems like you were afk for a bit.") 
            return
        }
        const eventImage = eventImageAns
        try {
            var newEventLink = {
                // Google Calendar object.
                title: eventTitle,
                description: eventDescription,
                start: eventDate,
                duration: eventDuration,
                location: "DSCUA Youtube Channel/https://www.youtube.com/channel/UCvh6IBI7dg_IjjZ_wBo2jZw"
            }
        } catch(err) {
            message.author.send('There was something wrong about your duration answer. Please try again from the start.')
            return
        }


        const eventEmbed = await new MessageEmbed()
            .addFields({ name: eventTitle, value: eventDescription },
                {name: "Time", value: `${eventDate.toLocaleString(DateTime.DATETIME_FULL)}\nDuration: ${eventDurationAns}\n[Add to Google Calendar](${google(newEventLink)})` }, 
                {name: "Location", value: `[DSCUA Youtube Channel](https://www.youtube.com/channel/UCvh6IBI7dg_IjjZ_wBo2jZw)`})
            .setImage(eventImage)
            .setColor("#4285F4");
        
        const eventChannelid = await client.channels.fetch(eventChannel)
        eventChannelid.send({embed: eventEmbed})
        
        
        const newEvent = await Event.create({
           event_embed: eventEmbed,
           event_channel: eventChannel,
           event_title: eventTitle,
           event_description: eventDescription,
           event_time_string: eventDate.toLocaleString(DateTime.DATETIME_FULL),
           min15Reminder: false,
           dayReminder: false,
           liveReminder: false,
           guildId: message.guild.id,
           event_link: google(newEventLink),
           event_image: eventImage
        })
    } else if (message.content.toLowerCase() === "$event_cancel" || message.content.toLowerCase() === "$event_list") {
        if (!message.member.hasPermission("MANAGE_CHANNELS")) return

        const allEvents = await Event.find({})
        const eventListArr = []
        const eventListId = []
        for (const [i, events] of allEvents.entries()) {
            if (events.guildId != message.guild.id) {
                continue
            }
            console.log(events.guildId)
            console.log(message.guild.id)
            const event = `${i+1}. ${events.event_title}`
            eventListArr.push(event)
            eventListId.push(events._id)
        }
        console.log(eventListId)
        if (message.content.toLowerCase() === '$event_list'){
            if (eventListArr.length === 0){
                var eventList = new MessageEmbed()
                .setDescription('There are no events scheduled for now.\nIf you want to create an event, type `$event` in a channel.')
            } else {
                var eventList = new MessageEmbed()
                .addFields({name: 'Here are the list of events:', value: eventListArr.join('\n')})
            }
            message.channel.send(eventList)
        } else {
            if (eventListArr.length === 0){
                var eventList = new MessageEmbed()
                .setDescription('There are no events scheduled for now.\nIf you want to create an event, type `$event` in a channel.')
                message.channel.send(eventList)
                return
            } else {
                var eventList = new MessageEmbed()
                .addFields({name: 'Here are the list of events:', value: `${eventListArr.join('\n')}\nPlease enter the number of events listed above to delete that event.`})
                message.channel.send(eventList)
            }
            const eventRemove = await message.channel.awaitMessages(filter, { max: 1, time: 120000, }).then((collected) => {return parseInt(collected.first().content)})
            .catch(err => {return 0})
            if (eventRemove === 0){
                return
            } else if (0<eventRemove<=eventListId.length){
                await Event.deleteMany({ _id: new ObjectId(String(eventListId[eventRemove-1])) })
                message.channel.send("Event removed successfully.")
            } else {
                message.channel.send("Wrong command.")
            }
        }
    }  else if (message.content.toLowerCase() === '$help'){
        if (!message.member.hasPermission("MANAGE_CHANNELS")) return
        
        const helpEmbed = new MessageEmbed()
        .addFields({ name:'Here are the list of commands:', 
        value: "**1** `$event`: Creates a new event.\n**2** `$event_list`: Lists all the events scheduled.\n**3** `$event_cancel`: Cancels the event chosen.\nA reminder will be sent 24 hours and 15 minutes before the event. There will also be a reminder that the event has started."})
        message.channel.send(helpEmbed)
    }
});

async function checkForPosts() {
    const currentTime1 = DateTime.now().setZone('America/Phoenix').toLocaleString(DateTime.DATETIME_FULL)
    const currentTime15 = DateTime.now().plus({ minute: 15 }).setZone('America/Phoenix').toLocaleString(DateTime.DATETIME_FULL)
    const currentTimeDayBefore = DateTime.now().plus({ day: 1 }).setZone('America/Phoenix').toLocaleString(DateTime.DATETIME_FULL)
    const currentTime = {
        event_time_string: currentTime1
    }
    const currentTime15min = {
        event_time_string: currentTime15
    }
    const currentTimeOneDay = {
        event_time_string: currentTimeDayBefore 
    }
    
    const resultsNow = await Event.find(currentTime).catch((err) => {return []})
    for (const event of resultsNow) {
        if (event.liveReminder == false) {
            const messageChannel = await client.channels.fetch(event.event_channel);
            const event_embed = await new MessageEmbed()
            .addFields({name: `${event.event_title} is Live!`, 
            value: `Hey @everyone, the event is currently live on our [youtube channel](https://www.youtube.com/channel/UCvh6IBI7dg_IjjZ_wBo2jZw)!`},
            {name: `> Event Description`, value: `> ${event.event_description}\n[RSVP here on our website]()`})
            .setColor("#0F9D58")
            .setImage(event.event_image);
            messageChannel.send({embed: event_embed});
            messageChannel.send('@everyone')
            event.liveReminder = true
            await event.save()
    }}

    const results15min = await Event.find(currentTime15min).catch((err) => {return []})
    for (const event of results15min) {
        if (event.min15Reminder == false) {
            const messageChannel = await client.channels.fetch(event.event_channel);
            const event_embed = await new MessageEmbed()
            .addFields({name: `${event.event_title} is in 15 minutes!`, 
            value: `Hey @everyone, the event will be live on our [youtube channel](https://www.youtube.com/channel/UCvh6IBI7dg_IjjZ_wBo2jZw) in 15 minutes!`},
            {name: `> Event Description`, value: `> ${event.event_description}`})
            .setColor("#F4B400")
            .setImage(event.event_image);
            messageChannel.send({embed: event_embed});
            messageChannel.send('@everyone')
            event.min15Reminder = true
            await event.save()
    }}
    const resultsDay = await Event.find(currentTimeOneDay).catch(err => {return []})
    for (const event of resultsDay) {
        if (event.dayReminder == false) {
            const eventLink = await event.event_link
            const messageChannel = await client.channels.fetch(event.event_channel);
            const event_embed = await new MessageEmbed()
            .addFields({name: `${event.event_title} is in 24 hours!`, 
            value: `Hey @everyone, the event will be live on our [youtube channel](https://www.youtube.com/channel/UCvh6IBI7dg_IjjZ_wBo2jZw) in 24 hours!`},
            {name: `> Event Description`, value: `> ${event.event_description}`+`\n\n[Add to Google Calendar](${google(eventLink)})`})
            .setColor("#DB4437")
            .setImage(event.event_image);
            messageChannel.send({ embed: event_embed });
            messageChannel.send('@everyone')
            event.dayReminder = true
            await event.save()
    }}

    await Event.deleteMany({ liveReminder: true })
    setTimeout(checkForPosts, 1000*1 )
}

client.on('guildMemberAdd', async (member) => {
    newMemberEmbed = new MessageEmbed()
    .addFields({name: "Welcome to University of Arizona Developer Student Club!", value:`Greetings from Developer Student Clubs at The University of Arizona (DSCUA)! We welcome you to learn more about us, become an official member, and watch some of our past events on our [website](https://dsc.community.dev/the-university-of-arizona/). There are many more events to come but for now, feel free to also look through our channels to see what interests you and chat with other like minded students like yourself!`},
    {name: "Links", value: "[Website](https://dsc.community.dev/the-university-of-arizona/)\n([Instagram](https://www.instagram.com/dscua/?hl=en)\n[Facebook](https://www.facebook.com/dscua/)\n[Linkedin](https://www.linkedin.com/company/dscua/)"})
    .setColor("#4285F4");
    member.send(newMemberEmbed)
})
client.login(process.env.DISCORDJS_BOT_TOKEN);
