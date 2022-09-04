import BetterClient from "../../../../lib/extensions/BetterClient.js";
import BetterMessage from "../../../../lib/extensions/BetterMessage.js";
import ApplicationCommand from "../../../../lib/classes/ApplicationCommand.js";
import BetterCommandInteraction from "../../../../lib/extensions/BetterCommandInteraction.js";

export default class Ping extends ApplicationCommand {
    constructor(client: BetterClient) {
        super("ping", client, {
            type: "CHAT_INPUT",
            description: `Pong! Get the current ping / latency of ${client.config.botName}.`
        });
    }

    public override async run(interaction: BetterCommandInteraction) {
        const language =
            interaction.language || (await interaction.fetchLanguage());

        const message = (await interaction.reply({
            content: language.get("PING"),
            fetchReply: true
        })) as unknown as BetterMessage;
        const hostLatency =
            message.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(this.client.ws.ping);
        return interaction.editReply({
            content: language.get("PONG", {
                roundTrip: hostLatency + apiLatency,
                hostLatency,
                apiLatency
            })
        });
    }
}
