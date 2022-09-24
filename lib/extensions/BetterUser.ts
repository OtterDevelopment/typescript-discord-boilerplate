import { RawUserData } from "discord.js/typings/rawDataTypes.js";
import { Structures, User, UserMention } from "discord.js";
import BetterClient from "./BetterClient.js";
import UserSettings from "../classes/UserSettings.js";

export default class BetterUser extends User {
    declare readonly client: BetterClient;

    public settings: UserSettings;

    /**
     * Create our BetterUser.
     * @param client Our client.
     * @param data The raw data for our user.
     */
    constructor(client: BetterClient, data: RawUserData) {
        super(client, data);

        this.settings = new UserSettings(client, this);
    }

    /**
     * Convert our user into a string using toString.
     * @returns The user's username#discriminator.
     */
    public override toString() {
        return this.tag as unknown as UserMention;
    }

    /**
     * Convert our user into a user mention.
     * @returns The user's mention.
     */
    public toMention() {
        return super.toString();
    }
}

// @ts-ignore
Structures.extend("User", () => BetterUser);
