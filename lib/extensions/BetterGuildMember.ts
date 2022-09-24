import {
    RESTPatchAPIGuildMemberResult,
    Routes
} from "discord-api-types/v10.js";
import { GuildMember, Structures } from "discord.js";
import { RawGuildMemberData } from "discord.js/typings/rawDataTypes";
import BetterClient from "./BetterClient.js";
import BetterGuild from "./BetterGuild.js";
import BetterUser from "./BetterUser.js";

export default class BetterGuildMember extends GuildMember {
    declare readonly client: BetterClient;

    declare readonly user: BetterUser;

    public communicationDisabledUntilTimestamp?: number;

    /**
     * Create our GuildMember.
     * @param client Our client.
     * @param data The raw data for our guild member.
     * @param guild The guild this member is in.
     */
    constructor(
        client: BetterClient,
        data: RawGuildMemberData & { communication_disabled_until?: number },
        guild: BetterGuild
    ) {
        super(client, data, guild);

        if (data.communication_disabled_until)
            this.communicationDisabledUntilTimestamp = new Date(
                data.communication_disabled_until
            ).getTime();
    }

    /**
     * Get a Date object representing the time this member's communication is disabled until.
     */
    get communicationDisabledUntil() {
        return this.communicationDisabledUntilTimestamp
            ? new Date(this.communicationDisabledUntilTimestamp)
            : null;
    }

    /**
     * Set communication_disabled_until on this member.
     * @param options The options to use when setting communication_disabled_until.
     * @returns The member with the new communication_disabled_until.
     */
    async setCommunicationDisabled(options: {
        until: Date | null;
        reason?: string;
    }) {
        const { until, reason } = options;
        const patched = (await this.client.requests.patch(
            Routes.guildMember(this.guild.id, this.id),
            {
                body: {
                    communication_disabled_until: until?.toISOString() ?? null
                },
                reason
            }
        )) as RESTPatchAPIGuildMemberResult;

        this.communicationDisabledUntilTimestamp = Number.isNaN(
            parseInt(patched.communication_disabled_until ?? "a", 10)
        )
            ? parseInt(patched.communication_disabled_until ?? "a", 10)
            : undefined;

        return this;
    }
}

// @ts-ignore
Structures.extend("GuildMember", () => BetterGuildMember);

