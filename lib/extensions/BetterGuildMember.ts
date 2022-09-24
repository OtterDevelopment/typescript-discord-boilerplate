import { Routes, RESTPatchAPIGuildMemberResult } from "discord-api-types/v10";
import { GuildMember, Role, Structures } from "discord.js";
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

    /**
     * Mute a member.
     * @param options The options to use when muting the member.
     * @param options.until The Date object representing the time this member's is muted until.
     * @param options.reason The reason this member is muted.
     * @param options.muteRole The role to mute this member with, otherwise use a timeout.
     * @param options.moderator The moderator that muted this member, if none is provided we can assume it was automod.
     * @returns The muted member.
     */
    async mute(options: {
        until?: Date;
        reason?: string;
        muteRole?: Role;
        moderator?: BetterGuildMember;
    }) {
        const { until, reason, muteRole } = options;
        const moderator = options.moderator || this.guild.me!;

        const language = await (
            moderator.user as BetterUser
        ).settings.getLanguage();

        this.client.logger.debug(0);

        if (!moderator.permissions.has("MODERATE_MEMBERS"))
            return [
                this,
                false,
                language.get("CLIENT_MISSING_MODERATE_MEMBERS", {
                    moderateMembers: language.get("MODERATE_MEMBERS")
                })
            ];
        else if (
            this.guild.me!.roles.highest.position <= this.roles.highest.position
        )
            return [
                this,
                false,
                language.get("CLIENT_HIERARCHY_CONFLICT_MUTE")
            ];
        else if (
            this.roles.highest.position >= moderator.roles.highest.position
        )
            return [
                this,
                false,
                language.get("MODERATOR_HIERARCHY_CONFLICT_MUTE")
            ];

        this.client.logger.debug(1);

        let success = false;

        if (muteRole) {
            await this.roles.add(muteRole);
            if (this.roles.cache.has(muteRole.id)) success = true;
        } else {
            const previousTimestamp = this.communicationDisabledUntilTimestamp;

            await this.setCommunicationDisabled({
                until: until || new Date(Date.now() + 1000 * 60 * 60 * 24 * 29),
                reason: `Muted by ${moderator.user.tag}${
                    reason ? ` for: ${reason}` : ""
                }`
            });

            success =
                this.communicationDisabledUntilTimestamp !== previousTimestamp;
        }

        if (!success) return [this, false];

        this.client.logger.debug(2);

        const caseCount = await this.client.prisma.case.aggregate({
            _count: {
                guildId: true
            },
            where: { guildId: this.guild.id }
        });

        const mute = await this.client.prisma.mute.create({
            data: {
                userId: this.id,
                endsAt: until,
                case: {
                    create: {
                        caseId: caseCount._count.guildId + 1,
                        moderatorId: moderator.id,
                        guildId: this.guild.id,
                        userId: this.id,
                        type: "MUTE",
                        reason
                    }
                }
            },
            include: { case: true }
        });

        return [this, success, mute];
    }
}

// @ts-ignore
Structures.extend("GuildMember", () => BetterGuildMember);
