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
}

