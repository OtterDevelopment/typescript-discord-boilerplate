/* eslint-disable @typescript-eslint/lines-between-class-members */
import BetterClient from "../extensions/BetterClient";

export default class Cache {
    public readonly client: BetterClient;
    public dontInteract: string[];

    public complimentsDisabled: string[];

    constructor(client: BetterClient) {
        this.client = client;
        this.dontInteract = [];
        this.complimentsDisabled = [];
    }

    public async loadCache() {
        await this.client.mongo
            .db("users")
            .collection("dontInteract")
            .find()
            .forEach(document => {
                this.dontInteract.push(document.userId);
            });
        await this.client.mongo
            .db("guilds")
            .collection("compliments")
            .find()
            .forEach(document => {
                this.complimentsDisabled.push(document.guildId);
            });
    }
}
