import AutoComplete from "./AutoComplete.js";
import BetterClient from "../extensions/BetterClient.js";
import BetterAutocompleteInteraction from "../extensions/BetterAutocompleteInteraction.js";

void BetterAutocompleteInteraction;

export default class AutoCompleteHandler {
    private readonly client: BetterClient;

    constructor(client: BetterClient) {
        this.client = client;
    }

    /**
     * Load all the autoCompletes in the autoCompletes directory.
     */
    public loadAutoCompletes() {
        this.client.functions
            .getFiles(
                `${this.client.__dirname}/dist/src/bot/autoCompletes`,
                "",
                true
            )
            .forEach(parentFolder =>
                this.client.functions
                    .getFiles(
                        `${this.client.__dirname}/dist/src/bot/autoCompletes/${parentFolder}`,
                        ".js"
                    )
                    .forEach(async fileName => {
                        const autoCompleteFile = await import(
                            `../../src/bot/autoCompletes/${parentFolder}/${fileName}`
                        );
                        const autoComplete: AutoComplete =
                            // eslint-disable-next-line new-cap
                            new autoCompleteFile.default(this.client);
                        return this.client.autoCompletes.set(
                            autoComplete.name[0],
                            autoComplete
                        );
                    })
            );
    }

    /**
     * Reload all the autoCompletes in the autoCompletes directory.
     */
    public reloadAutoCompletes() {
        this.client.autoCompletes.clear();
        this.loadAutoCompletes();
    }

    /**
     * Fetch the autoComplete with the provided name.
     * @param name The name to search for.
     * @returns The autoComplete we've found.
     */
    private fetchAutoComplete(name: string): AutoComplete | undefined {
        return this.client.autoCompletes.find(autoComplete =>
            autoComplete.name.some(autoCompleteName =>
                name.startsWith(autoCompleteName)
            )
        );
    }

    /**
     * Handle the interaction created for this autoComplete to make sure the user and client can execute it.
     * @param interaction The interaction created.
     */
    public async handleAutoComplete(
        interaction: BetterAutocompleteInteraction
    ) {
        const name = [
            interaction.commandName,
            interaction.options.getSubcommandGroup(false) || "",
            interaction.options.getSubcommand(false) || "",
            interaction.options.getFocused(true).name || ""
        ]
            .filter(Boolean)
            .join("-");
        const autoComplete = this.fetchAutoComplete(name);
        if (!autoComplete) return;

        return this.runAutoComplete(autoComplete, interaction);
    }

    /**
     * Execute our autoComplete.
     * @param autoComplete The autoComplete we want to execute.
     * @param interaction The interaction for our autoComplete.
     */
    private async runAutoComplete(
        autoComplete: AutoComplete,
        interaction: BetterAutocompleteInteraction
    ) {
        autoComplete
            .run(interaction)
            .then(() =>
                this.client.dataDog.increment("autocompleteUsage", 1, [
                    `completion:${autoComplete.name}`
                ])
            )
            .catch(async (error): Promise<any> => {
                this.client.logger.error(error);
                await this.client.logger.sentry.captureWithInteraction(
                    error,
                    interaction
                );

                if (!interaction.responded) return interaction.respond([]);
            });
    }
}
