import { RawGuildData } from "discord.js/typings/rawDataTypes.js";
import { Structures, Guild } from "discord.js";
import BetterClient from "./BetterClient.js";
import GuildSettings from "../classes/GuildSettings.js";

export default class BetterGuild extends Guild {
    declare readonly client: BetterClient;

    public settings: GuildSettings;

    /**
     * Create our BetterUser.
     * @param client Our client.
     * @param data The raw data for our user.
     */
    constructor(client: BetterClient, data: RawGuildData) {
        super(client, data);

        this.settings = new GuildSettings(client, this);
    }
}

// @ts-ignore
Structures.extend("Guild", () => BetterGuild);
