# Logging Utility
A wrapper around [winston](https://www.npmjs.com/package/winston) that helps setup logging.
Also an effort to standardize logging format across projects.
Some features include:
* Memory info
* Stack traces
* Colorized logs in dev
* JSON logging format, making it convenient to parse and use in SumoLogic
* Custom fields that can be added in every log message
* Configurable scrubbing
    * Specify a scrubber function that runs on every message about to be logged
    * Specify fields you want to be scrubbed on a per-message basis
    * [See examples below](https://github.com/GoodTimeio/node-logger#scrubbing-sensitive-fields)!
* All other features that [winston](https://www.npmjs.com/package/winston) has like [profiling](https://www.npmjs.com/package/winston#profiling)

Some features that are coming in the future:
* Optional Sentry transport for errors

# Usage
Screenshots are in a section further below.
```ts
/// server.ts
import log, { GTLogger } from '@goodtimeio/node-logger';

GTLogger.init({
    environment: 'prod',
    name: 'test',
    additionalInfo: () => ({
        requestId: cls.getValue('requestId'),
        ip: cls.getIP('ip'),
        dynoId: global.DYNO_ID,
        workerId: config.worker.id,
    }),
});

// start logging
log.info("starting server");

// end logging
log.end(); // wait for all logs to be written
```

```ts
/// any-other-file-in-project.ts
import log from '@goodtimeio/node-logger';

try {
    throw new Error("Divide by zero");
} catch (err) {
    // you can log the error object directly!
    log.error(err);
    // or provide a message and then log it
    log.error('i erred', err);
}

log.warn("warning");

// log objects too
log.info("informational", { additionalField1: "hey", additionalField2: { nesting: { some: 'more' } } });

// more levels!
log.verbose("verbose");
log.debug("debug");
```

# Scrubbing Sensitive Fields

## Approach 1: Specify scrubber function
The scrubber function will run on every message about to logged.
```ts
import log, { GTLogger } from '@goodtimeio/node-logger';

GTLogger.init({
    environment: 'prod',
    name: 'test',
    additionalInfo: () => ({
        requestId: cls.getValue('requestId'),
        ip: cls.getIP('ip'),
        dynoId: global.DYNO_ID,
        workerId: config.worker.id,
    }),
    scrubber: ({ level, message, ...rest }) => {
        if (rest.authorizationHeader) {
            rest.authorizationHeader = '[REDACTED]';
        }

        // only do this for `log.info` messages
        if (level === 'info') {
            // `message` is the string you pass to `log.info`
            // for example, if you called `log.info('test'), `message` will be set to `'test'`.
            message += ' informational';
        }
        message = scrubEmails(message);
        return {
            level,
            message,
            ...rest,
        };
    },
});

// start logging
log.info("starting server", { authorizationHeader: 'xyz-ssn' });
// console output:
// {
//      level: 'info',
//      message: 'starting server informational',
//      ...
// }
```

## Approach 2: Specify fields you want to be scrubbed
You can also specify fields you want to be scrubbed on a per message basis.
```ts
const gtInterview = {
    firstName: 'Stefano',
    lastName: 'D\'Amico',
    coordinator: {
        firstName: 'Peter',
        lastName: 'Lee',
        email: 'peter@goodtime.io',
    }
    guest: {
        phone: '123-456-7890',
        otherField: 'xyz',
    }
};

log.info('interview', {
    interview: gtInterview,
    scrub: ['firstName', 'lastName', 'email', 'phone'],
})
// console output:
// {
//    level: 'info',
//    message: 'interview',
//    interview: {
//         firstName: '[REDACTED]',
//         lastName: '[REDACTED]',
//         coordinator: {
//               firstName: '[REDACTED]',
//               lastName: '[REDACTED]',
//               email: '[REDACTED]',
//         },
//         guest: {
//               phone: '[REDACTED]',
//               other: 'xyz',
//         },
//    },
//    ...
// }
```

# How the logs look in dev
![image](https://user-images.githubusercontent.com/18729755/83693883-962a2300-a5bc-11ea-9a29-baf9e6fcd788.png)
![image](https://user-images.githubusercontent.com/18729755/83694443-aabaeb00-a5bd-11ea-91d8-15942abe806e.png)

# Screenshot of prod logs being queried in SumoLogic
![image](https://user-images.githubusercontent.com/18729755/83688246-b2c15d80-a5b2-11ea-8318-47f23eba3e9e.png)
