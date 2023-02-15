import { Message } from "discord.js";
import EventHandler from "../../../lib/classes/EventHandler.js";

export default class MessageCreate extends EventHandler {
    /**
     * Handle the creation of a message.
     * @param message The message that was created.
     */
    public override async run(message: Message) {
        if (message.author.bot) return;

        return this.client.textCommandHandler.handleTextCommand(message);
    }
}
