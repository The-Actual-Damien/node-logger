import * as winston from 'winston';
import memoryFormat from './memory';

import stacktrace from 'stack-trace';

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
    additionalInfo?: () => Record<string, string>;
}

function getLoggerOptions(config?: Config): winston.LoggerOptions {
    const formats = [
        // Enable error logging as well as stack traces.
        winston.format.errors({ stack: true }),
        // All errors
        winston.format((info) => {
            if (!info.stack && info.level === 'error') {
                // get the current stack trace
                const trace = stacktrace.parse(new Error());

                // get rid of all function calls inside the logging lib from the stack trace
                const filepaths = trace.map((t) => t.getFileName());
                const index = filepaths.findIndex((path) => !path.includes('node-logger'));
                if (index !== -1) {
                    info.stack = trace.slice(index);
                } else {
                    info.stack = trace;
                }

                info.stack = (info.stack as stacktrace.StackFrame[]).reduce((accum, frame) => {
                    let callerName = frame.getFunctionName() || '';
                    if (frame.getTypeName()) {
                        callerName += frame.getTypeName() || '';
                    }
                    if (frame.getMethodName()) {
                        callerName += frame.getTypeName() || '';
                    }
                    return `${accum}    at ${callerName}(${frame.getFileName()}:${frame.getLineNumber()}:${frame.getColumnNumber()})\n`;
                }, 'Error\n');
            }
            return info;
        })(),
        // Add memory info.
        memoryFormat(),
        // Add `additionalInfo` and `name`
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
        // Our official logging format.
        winston.format.json(),
    ];

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
    private static _logger: winston.Logger;

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
}

// TODO: check how typescript modules are loaded
export default GTLogger.logger;
