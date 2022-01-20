import {
    Message,
    MessagePayload,
    ReplyMessageOptions,
    Structures
} from "discord.js";

export default class BetterMessage extends Message {
    public override async reply(
        options: string | MessagePayload | ReplyMessageOptions
    ): Promise<BetterMessage> {
        try {
            if (this.deleted) return await this.channel.send(options);
            else return await this.reply(options);
        } catch {
            return this.channel.send(options);
        }
    }
}

// @ts-ignore
Structures.extend("Message", () => BetterMessage);
