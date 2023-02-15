import {
    ActivityType,
    GatewayIntentBits,
    PresenceData,
    PermissionResolvable
} from "discord.js";

export default {
    /** The prefix the bot will use for text commands, the prefix is different depending on the NODE_ENV. */
    prefixes: process.env.NODE_ENV === "production" ? ["!"] : ["!!"],
    /** The name the bot should use across the bot. */
    botName: "",

    /** The bot's current version, this is the first 7 characters from the current Git commit hash. */
    version: "???",
    /** A list of users that are marked as administrators of the bot, these users have access to eval commands. */
    admins: ["619284841187246090"],
    /* The ID for the test guild  */
    testGuildId: "925264080250494977",

    /** The presence that should be displayed when the bot starts running. */
    presence: {
        status: "online",
        activities: [
            {
                type: ActivityType.Playing,
                name: "with /help"
            }
        ]
    } as PresenceData,

    /** The hastebin server that we should use for uploading logs. */
    hastebin: "https://haste.polars.cloud",

    /** An object of the type Record<string, string>, the key corelating to when the value (a hexadecimal code) should be used. */
    colors: {
        primary: 0x5865f2,
        success: 0x57f287,
        warning: 0xfee75c,
        error: 0xed4245
    },

    /** The list of intents the bot requires to function. */
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],

    /** A list of permissions that the bot needs to function at all. */
    requiredPermissions: [
        "EmbedLinks",
        "SendMessages"
    ] as PermissionResolvable[]
};
