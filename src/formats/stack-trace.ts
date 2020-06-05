import * as winston from 'winston';

const stackTraceFormat = winston.format((info) => {
    // If an error message is getting logged but has no stack trace, add one.
    if (!info.stack && info.level === 'error') {
        // The stack trace contains stack frames inside the logging library as well.
        // It is possible to get rid of the stack frames inside this library,
        // but writing testcases then becomes a bit more difficult so
        // not going to worry aboout that.
        info.stack = new Error().stack;
    }
    return info;
});

export default stackTraceFormat;
