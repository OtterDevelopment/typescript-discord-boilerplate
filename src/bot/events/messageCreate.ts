import EventHandler from "../../../lib/classes/EventHandler.js";
import BetterMessage from "../../../lib/extensions/BetterMessage.js";

export default class MessageCreate extends EventHandler {
    override async run(message: BetterMessage) {
        this.client.dataDog.increment("messagesSeen");
        if (message.author.bot) return;
        // @ts-ignore
        return this.client.textCommandHandler.handleCommand(message);
    }
}

