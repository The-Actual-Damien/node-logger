import * as winston from 'winston';

import attachMemoryUsageInfo from '@src/formats/memory';
import attachScrubber from '@src/formats/scrubber';
import attachStackTrace from '@src/formats/stack-trace';

interface Info {
    log: string;
    message: string;
    [rest: string]: unknown;
}

export interface Config extends Pick<winston.LoggerOptions, 'silent' | 'transports'> {
    /**
     * If environment is `dev`, we will prettify the output.
     */
    environment: 'dev' | 'prod';
    /**
     * Name of the log. For example, the Pushkin project might set this to "pushkin".
     */
    name: string;
    /**
     * If there is additional data you would like in every one of the logs, provide it here.
     * You might, for example, want to provide the dyno and the process/cluster id here.
     * If available, you might also want to provide the requestId, the jobIb, and/or the IP of the current
     * request here.
     */
    additionalInfo?: () => Record<string, unknown>;
    /**
     * If you'd like to run some scrubber on all logs, specify it here.
     * For example, you might want to check to see if you're about to log a response from axios and
     * then scrub all sensitive fields.
     * Or you might want to scrub all the emails.
     */
    scrubber?: (input: Info) => Info;
}

const id = <T>(x: T): T => x;

// generate the winston configuration based on the config
function getLoggerOptions(config?: Config): winston.LoggerOptions {
    const formats = [
        // Enable stack traces if an Error object was logged.
        winston.format.errors({ stack: true }),
        // Scrub sensitive fields.
        attachScrubber(config?.scrubber || id),
        // Attach a stack trace to `log.error` calls that don't already have a stack trace.
        attachStackTrace(),
        // Add `additionalInfo` and `name`.
        winston.format((info) => {
            info = {
                ...info,
                label: config?.name || 'unknown',
            };
            if (config?.additionalInfo) {
                info.metadata = {
                    ...info.metadata,
                    ...config.additionalInfo(),
                };
            }
            return info;
        })(),
    ];

    if (config?.environment === 'prod') {
        // Add memory info.
        formats.push(attachMemoryUsageInfo());
    }

    // Our official logging format.
    formats.push(winston.format.json());

    if (config?.environment === 'dev') {
        // Heroku adds a timestamp to our logs in prod,
        // but it's convenient to also have a timestamp in dev.
        formats.push(winston.format.timestamp());

        // Prettify output. Among other things, it makes sure that new lines in
        // stack traces appear as new lines in the console.
        //`
        // Can't use this format in production:
        // > The prettyPrint format should not be used in production because it may
        // > impact performance negatively and block the event loop.
        // [source](https://github.com/winstonjs/logform#prettyprint)
        formats.push(winston.format.prettyPrint());

        // Color outputs in dev for convenience.
        formats.push(winston.format.colorize({ all: true }));
    }

    const options: winston.LoggerOptions = {
        format: winston.format.combine(...formats),
        // In prod, we use a Heroku console drain, so we need to output to console.
        // In dev, we output to console for convenience.
        transports: [new winston.transports.Console({ level: 'debug' })],
        ...config,
    };
    return options;
}

// A singleton that manages the winston logger instance.
export class GTLogger {
    private static _logger?: winston.Logger;

    static init(config: Config): void {
        if (this._logger) {
            this._logger.configure(getLoggerOptions(config));
        } else {
            this._logger = winston.createLogger(getLoggerOptions(config));
        }
    }

    static get logger(): winston.Logger {
        if (!this._logger) {
            this._logger = winston.createLogger(getLoggerOptions());
        }
        return this._logger;
    }

    // for tests
    static reset(): void {
        this._logger = undefined;
    }
}

// TODO: check how typescript modules are loaded
export default GTLogger.logger;
