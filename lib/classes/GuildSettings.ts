import { Role } from "discord.js";
import { APIRole } from "discord-api-types/v10.js";
import BetterGuild from "../extensions/BetterGuild.js";
import BetterClient from "../extensions/BetterClient.js";

export default class GuildSettings {
    public readonly client: BetterClient;

    public readonly guild: BetterGuild;

    /**
     * Create our GuildSettings.
     * @param client Our client.
     */
    constructor(client: BetterClient, guild: BetterGuild) {
        this.client = client;
        this.guild = guild;
    }

    /**
     * Get the guild's language.
     * @returns The guild's language.
     */
    public async getLanguage() {
        const guildConfig = await this.client.prisma.guildConfig.findUnique({
            where: { guildId: this.guild.id }
        });

        return this.client.languageHandler.getLanguage(
            guildConfig?.language ?? "en-US"
        );
    }

    /**
     * Set the guild's language.
     * @param language The language to set.
     * @returns The updated guild language.
     */
    public async setLanguage(language: string) {
        return this.client.prisma.guildConfig
            .upsert({
                where: {
                    guildId: this.guild.id
                },
                create: {
                    guildId: this.guild.id,
                    language
                },
                update: {
                    language
                }
            })
            .then(guildConfig => guildConfig.language);
    }

    /**
     * Get the guild's mute roles.
     * @returns The mute roles for the guild.
     */
    public async getMuteRoles(idsOnly?: boolean) {
        const guildConfig = await this.client.prisma.guildConfig.findUnique({
            where: { guildId: this.guild.id }
        });

        if (idsOnly) return guildConfig?.muteRoleIds || [];

        return (
            (guildConfig?.muteRoleIds
                .flatMap(roleId =>
                    this.client.guilds.cache.map(guild =>
                        guild.roles.cache.get(roleId)
                    )
                )
                .filter(Boolean) as unknown as Promise<Role[]>) || []
        );
    }

    /**
     * Add a mute role to the guild.
     * @param role The role to add.
     * @returns The updated guild mute roles.
     */
    public async addMuteRole(role: Role | APIRole, returnIdsOnly?: boolean) {
        const currentMuteRoles = (await this.getMuteRoles(true)) as string[];

        return this.client.prisma.guildConfig
            .upsert({
                where: {
                    guildId: this.guild.id
                },
                create: {
                    guildId: this.guild.id,
                    muteRoleIds: {
                        set: [role.id]
                    }
                },
                update: {
                    muteRoleIds: {
                        set: [
                            ...currentMuteRoles.filter(
                                roleId => roleId !== role.id
                            ),
                            role.id
                        ]
                    }
                }
            })
            .then(guildConfig => {
                if (returnIdsOnly) return guildConfig.muteRoleIds;

                return guildConfig.muteRoleIds
                    .flatMap(roleId =>
                        this.client.guilds.cache.map(guild =>
                            guild.roles.cache.get(roleId)
                        )
                    )
                    .filter(Boolean) as unknown as Role[];
            });
    }

    /**
     * Remove a mute role from the guild.
     * @param role The role to remove.
     * @returns The updated guild mute roles.
     */
    public async removeMuteRole(role: Role | APIRole, returnIdsOnly?: boolean) {
        const currentMuteRoles = (await this.getMuteRoles(true)) as string[];

        return this.client.prisma.guildConfig
            .update({
                where: {
                    guildId: this.guild.id
                },
                data: {
                    muteRoleIds: {
                        set: [
                            ...currentMuteRoles.filter(
                                roleId => roleId !== role.id
                            )
                        ]
                    }
                }
            })
            .then(guildConfig => {
                if (returnIdsOnly) return guildConfig.muteRoleIds;

                return guildConfig.muteRoleIds
                    .flatMap(roleId =>
                        this.client.guilds.cache.map(guild =>
                            guild.roles.cache.get(roleId)
                        )
                    )
                    .filter(Boolean) as unknown as Role[];
            });
    }
}
