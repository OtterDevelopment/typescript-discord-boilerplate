import { Interaction } from "discord.js";
import EventHandler from "../../../lib/classes/EventHandler.js";
import BetterAutocompleteInteraction from "../../../lib/extensions/BetterAutocompleteInteraction.js";
import BetterButtonInteraction from "../../../lib/extensions/BetterButtonInteraction.js";
import BetterCommandInteraction from "../../../lib/extensions/BetterCommandInteraction.js";
import BetterContextMenuInteraction from "../../../lib/extensions/BetterContextMenuInteraction.js";
import BetterSelectMenuInteraction from "../../../lib/extensions/BetterSelectMenuInteraction.js";

export default class InteractionCreate extends EventHandler {
    override async run(interaction: Interaction) {
        this.client.logger.info(
            `${interaction.type} interaction created by ${interaction.user.id}${
                interaction.isCommand() ? `: ${interaction.toString()}` : ""
            }`
        );
        if (interaction.isCommand()) {
            this.client.stats.commandsRun++;
            return this.client.applicationCommandHandler.handleCommand(
                interaction as BetterCommandInteraction
            );
        } else if (interaction.isContextMenu())
            return this.client.applicationCommandHandler.handleCommand(
                interaction as BetterContextMenuInteraction
            );
        else if (interaction.isButton())
            return this.client.buttonHandler.handleButton(
                interaction as BetterButtonInteraction
            );
        else if (interaction.isSelectMenu())
            return this.client.dropDownHandler.handleDropDown(
                interaction as BetterSelectMenuInteraction
            );
        else if (interaction.isAutocomplete())
            return this.client.autoCompleteHandler.handleAutoComplete(
                interaction as BetterAutocompleteInteraction
            );
        else if (interaction.isModalSubmit()) return;
        const error = new Error("Invalid Interaction: Never seen this before.");
        this.client.logger.error(error);
        this.client.logger.sentry.captureWithInteraction(error, interaction);
        // @ts-ignore
        return interaction.reply(
            this.client.functions.generateErrorMessage({
                title: this.client.languageHandler
                    .getLanguage("en-US")
                    .get("INVALID_INTERACTION_TITLE"),
                description: this.client.languageHandler
                    .getLanguage("en-US")
                    .get("INVALID_INTERACTION_DESCRIPTION")
            })
        );
    }
}
