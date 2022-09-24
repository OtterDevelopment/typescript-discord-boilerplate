import BetterClient from "../extensions/BetterClient.js";
import BetterAutocompleteInteraction from "../extensions/BetterAutocompleteInteraction.js";

export default class AutoComplete {
    public readonly name: string[];

    public readonly client: BetterClient;

    /**
     * Create our autoComplete.
     * @param name The name of our autoComplete.
     * @param client Our client.
     */
    constructor(name: string[], client: BetterClient) {
        this.name = name;

        this.client = client;
    }

    /**
     * Run the autocomplete.
     * @param _interaction The interaction that was created.
     */
    public async run(
        _interaction: BetterAutocompleteInteraction
    ): Promise<void> {}
}
