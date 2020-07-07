import * as Sentry from '@sentry/node';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SentryTransport = require('@synapsestudios/winston-sentry');

export interface SentryConfig {
    sentryDsn: string;
    release: string;
    environment: string;
}

export const buildSentryTransport = (sentryConfig: SentryConfig) => {
    Sentry.init(sentryConfig);
    return new SentryTransport({ Sentry });
};
