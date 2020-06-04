import * as winston from 'winston';

const stackTraceFormat = winston.format((info) => {
    if (!info.stack && info.level === 'error') {
        info.stack = new Error().stack;
    }
    return info;
});

export default stackTraceFormat;
