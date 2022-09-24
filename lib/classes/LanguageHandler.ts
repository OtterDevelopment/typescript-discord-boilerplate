import BetterClient from "../extensions/BetterClient.js";
import Language, { LanguageOptions } from "./Language.js";

export default class LanguageHandler {
    public readonly client: BetterClient;

    public languages = new Set<Language>();

    /**
     * Create our LanguageHandler class.
     * @param client Our client.
     */
    constructor(client: BetterClient) {
        this.client = client;
    }

    /**
     * Load all of our languages into our array.
     */
    public loadLanguages() {
        this.client.functions
            .getFiles(`${this.client.__dirname}/dist/languages/`, ".json")
            .forEach(async fileName => {
                const languageFile: LanguageOptions = await import(
                    `../../languages/${fileName}`,
                    { assert: { type: "json" } }
                ).then(file => file.default);

                const language: Language = new Language(
                    this.client,
                    languageFile.LANGUAGE_ID!,
                    {
                        enabled: languageFile.LANGUAGE_ENABLED!,
                        language: languageFile
                    }
                );

                this.languages.add(language);
            });
    }

    /**
     * Get all enabled languages.
     */
    get enabledLanguages() {
        return [...this.languages].filter(language => language.enabled);
    }

    /**
     * Get a language with a given ID.
     * @param languageId The language id to get.
     * @returns The language with the given id.
     */
    public getLanguage(languageId: string) {
        return (
            this.enabledLanguages.find(
                language => language.id === languageId
            ) ||
            this.enabledLanguages.find(language => language.id === "en-US")!
        );
    }
}
