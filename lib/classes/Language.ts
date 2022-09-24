import { TOptions } from "i18next";
import BetterClient from "../extensions/BetterClient.js";
import * as enUS from "../../languages/en-US.json" assert { type: "json" };
import { LanguageValues } from "../../typings/language";

type LanguageKeys = keyof typeof enUS;
export type LanguageOptions = Partial<typeof enUS>;

export default class Language {
    public readonly client: BetterClient;

    public readonly id: string;

    public enabled: boolean;

    private language: LanguageOptions;

    /**
     * Create our Language class.
     * @param client Our client.
     * @param id The language id.
     * @param options The options for our language.
     */
    constructor(
        client: BetterClient,
        id: string,
        options: { enabled: boolean; language?: LanguageOptions } = {
            enabled: true
        }
    ) {
        this.id = id;
        this.client = client;

        this.enabled = options.enabled;
        this.language = options.language || enUS;
    }

    /**
     * Initialize our language in the i18next instance.
     */
    public init() {
        this.client.i18n.addResourceBundle(
            this.id,
            "simplemod",
            this.language,
            true,
            true
        );
    }

    /**
     * Check if our language has a key.
     * @param key The key to check for.
     * @returns Whether the key exists.
     */
    public has(key: string) {
        if (!this.enabled)
            return this.client.i18n.t(key, { lng: "en-US" }) !== key;
        return this.client.i18n.t(key, { lng: this.id }) !== key;
    }

    /**
     * Get a key.
     * @param key The key to get.
     * @param args The arguments for the key.
     * @returns The key if it exists.
     */
    public get<K extends LanguageKeys, O extends LanguageValues[K]>(
        key: K,
        args?: O & TOptions
    ) {
        if (args && !("interpolation" in args))
            args.interpolation = { escapeValue: false };
        if (!this.enabled) return this.client.i18n.t(key, { ...args });
        else if (!this.has(key))
            return `"${key} has not been localized for any languages yet."`;
        return this.client.i18n.t(key, { ...args, lng: this.id });
    }
}
