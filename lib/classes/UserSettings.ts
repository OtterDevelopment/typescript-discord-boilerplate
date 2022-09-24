import BetterClient from "../extensions/BetterClient.js";
import BetterUser from "../extensions/BetterUser.js";

export default class UserSettings {
    public readonly client: BetterClient;

    public readonly user: BetterUser;

    /**
     * Create our UserSettings.
     * @param client Our client.
     */
    constructor(client: BetterClient, user: BetterUser) {
        this.client = client;
        this.user = user;
    }

    /**
     * Get the user's language.
     * @returns The user's language.
     */
    public async getLanguage() {
        const userConfig = await this.client.prisma.userConfig.findUnique({
            where: { userId: this.user.id }
        });

        return this.client.languageHandler.getLanguage(
            userConfig?.language ?? "en-US"
        );
    }

    /**
     * Set the user's language.
     * @param language The language to set.
     * @returns The updated user language.
     */
    public async setLanguage(language: string) {
        return this.client.prisma.userConfig
            .upsert({
                where: {
                    userId: this.user.id
                },
                create: {
                    userId: this.user.id,
                    language
                },
                update: {
                    language
                }
            })
            .then(userConfig => userConfig.language!);
    }
}
