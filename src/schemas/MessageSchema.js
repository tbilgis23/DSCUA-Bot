const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    event_embed: Object,
    event_channel: mongoose.SchemaTypes.String,
    event_title: mongoose.SchemaTypes.String,
    event_description: mongoose.SchemaTypes.String,
    event_time_string: mongoose.SchemaTypes.String,
    min15Reminder: Boolean,
    dayReminder: Boolean,
    liveReminder: Boolean,
    guildId: mongoose.SchemaTypes.String
    // event_repeat: Boolean,
    // eventPhoto: mongoose.SchemaTypes.String
})

module.exports = mongoose.model("Event", MessageSchema);