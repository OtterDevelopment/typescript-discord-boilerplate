import {
    Message,
    MessagePayload,
    ReplyMessageOptions,
    Structures
} from "discord.js";
import Language from "../classes/Language";
import BetterClient from "./BetterClient";
import BetterGuild from "./BetterGuild";
import BetterUser from "./BetterUser";

export default class BetterMessage extends Message {
    public declare readonly client: BetterClient;

    public declare readonly author: BetterUser;

    public declare readonly guild: BetterGuild | null;

    public language: Language | null = null;

    /**
     * Get the user's language.
     * @returns The user's language.
     */
    public async fetchLanguage() {
        if (this.inGuild()) {
            const [userLanguage, guildLanguage] = await Promise.all([
                this.author.settings.getLanguage(),
                this.guild!.settings.getLanguage()
            ]);

            this.language =
                userLanguage.get("LANGUAGE_ID") !== "en-US"
                    ? userLanguage
                    : guildLanguage;
        } else {
            this.language = await this.author.settings.getLanguage();
        }

        return this.language;
    }

    /**
     * Better reply function, if the message is deleted, just send a normal message instead.
     * @param options The options for our reply.
     */
    public override async reply(
        options: string | MessagePayload | ReplyMessageOptions
    ): Promise<BetterMessage> {
        try {
            if (this.deleted)
                return (await this.channel.send(options)) as BetterMessage;
            else return (await super.reply(options)) as BetterMessage;
        } catch {
            return this.channel.send(options) as Promise<BetterMessage>;
        }
    }
}

// @ts-ignore
Structures.extend("Message", () => BetterMessage);
