import * as winston from 'winston';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const devLogFormat = () => {
    return winston.format.printf((info) => {
        const obj: Partial<typeof info> = {
            ...info,
        };

        delete obj.level;
        delete obj.label;
        delete obj.message;
        delete obj.timestamp;
        delete obj.stack;

        let output = `${info.timestamp} - [${info.level}] ${info.message} | ${JSON.stringify(obj)}`;
        if (info.stack) {
            output += `\n${info.stack}`;
        }
        return output;
    });
};

export default devLogFormat;
