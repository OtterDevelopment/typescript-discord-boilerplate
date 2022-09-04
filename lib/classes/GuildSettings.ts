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
        const guildConfig = await this.client.mongo
            .db("guilds")
            .collection("languages")
            .findOne({ userId: this.guild.id });

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
        return this.client.mongo
            .db("guilds")
            .collection("languages")
            .findOneAndUpdate(
                { guildId: this.guild.id },
                { $set: { language } },
                { upsert: true, returnDocument: "after" }
            )
            .then(guildConfig => guildConfig.value?.language);
    }
}
