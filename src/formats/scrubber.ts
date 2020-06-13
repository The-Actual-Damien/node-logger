import * as winston from 'winston';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import Redactyl from 'redactyl.js';

const redact = (obj: Record<string, unknown>, properties?: string[]) => {
    if (!properties || properties.length === 0) {
        return obj;
    }
    const redactyl = new Redactyl({
        properties,
    });
    return redactyl.redact(obj);
};

// Allow scrubbing data.
const scrubFormat = winston.format((info, scrubber) => {
    const internalState = {
        // The follow are fields the winston library uses internally.
        // We're going to preserve these internal fields.
        //
        // For example, the colorizer formatter uses the value associated with the
        //  `[LEVEL]` key.
        [LEVEL]: info[LEVEL],
        [MESSAGE]: info[MESSAGE],
        [SPLAT]: info[SPLAT],
        // We will not allow the scrubber to modify the displayed log level.
        level: info[LEVEL],
    };
    const scrubbedRes = scrubber(info);
    const scrubbedOutput = redact(scrubbedRes, [...(info.scrub || []), ...(scrubbedRes.scrub || [])]);
    return {
        message: '',
        ...scrubbedOutput,
        ...internalState,
    };
});

export default scrubFormat;
