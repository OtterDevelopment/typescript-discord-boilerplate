export default class BetterError extends Error {
    /**
     * The ID of the sentry error if it exists.
     */
    public readonly sentryId?: string;

    /**
     * Create our BetterMessage.
     * @param message The message for the error,
     * @param sentryId The ID oft the sentry error if it exists.
     */
    constructor(message: string, sentryId?: string) {
        super(message);

        this.sentryId = sentryId;
    }
}
