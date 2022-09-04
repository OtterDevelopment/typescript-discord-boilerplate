import { Structures, AutocompleteInteraction } from "discord.js";
import Language from "../classes/Language.js";
import BetterClient from "./BetterClient.js";
import BetterGuild from "./BetterGuild.js";
import BetterUser from "./BetterUser.js";

export default class BetterAutocompleteInteraction extends AutocompleteInteraction {
    public declare readonly client: BetterClient;

    public declare readonly user: BetterUser;

    public declare readonly guild: BetterGuild | null;

    public language: Language | null = null;

    /**
     * Get the user's language.
     * @returns The user's language.
     */
    public async fetchLanguage() {
        if (this.inGuild()) {
            const [userLanguage, guildLanguage] = await Promise.all([
                this.user.settings.getLanguage(),
                this.guild!.settings.getLanguage()
            ]);

            this.language =
                userLanguage.get("LANGUAGE_ID") !== "en-US"
                    ? userLanguage
                    : guildLanguage;
        } else {
            this.language = await this.user.settings.getLanguage();
        }

        return this.language;
    }
}

Structures.extend(
    "AutocompleteInteraction",
    // @ts-ignore
    () => BetterAutocompleteInteraction
);
