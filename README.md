# Logging Utility
A wrapper around [winston](https://www.npmjs.com/package/winston) that helps setup logging.
Also an effort to standardize logging format across projects.
Some features include:
* Memory info
* Stack traces
* Colorized logs in dev
* JSON logging format, making it convenient to parse and use in SumoLogic
* Custom fields that can be added in every log message
* All other features that [winston](https://www.npmjs.com/package/winston) has like profiling

Some features that are coming in the future:
* Compact dev logs
    * Not adding
* Testcases so we can make sure we aren't making removing any existing logging behavior
    * These will come after compact dev logs and once everyone has reviewed this project
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
    });
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
    // you can log the error object. you get the stack trace
    log.error(err);
}

log.warn("warning");

// log objects too
log.info("informational", { additionalField1: "hey", additionalField2: { nesting: { some: 'more' } } });
log.verbose("verbose");
log.debug("debug");
```

## How the logs look in dev
![image](https://user-images.githubusercontent.com/18729755/83693883-962a2300-a5bc-11ea-9a29-baf9e6fcd788.png)
![image](https://user-images.githubusercontent.com/18729755/83694443-aabaeb00-a5bd-11ea-91d8-15942abe806e.png)

# Logging Sensitive Fields
If you want to omit logging sensitive fields, the [redactyl](https://www.npmjs.com/package/redactyl.js) package is an option.
The package has a type declaration file and a good selection of testcases.
```ts
import Redactyl from 'redactyl.js';

interface Person {
    ssn: string;
    nested: { address: string };
};

const sensitiveFields = ['ssn', 'address'];
const redact = (obj) => {
    const redactyl = new Redactyl({
        properties: sensitiveFields,
    });
    return redactyl.redact(obj);
}

const person = {
    ssn: 'your ssn',
    nested: [
        {
            address: 'your current address',
        },
        {
            address: 'your previous address',
        },
    ]
};

log.info(redact(person))
```

# Screenshot of logs being queried in SumoLogic
![image](https://user-images.githubusercontent.com/18729755/83688246-b2c15d80-a5b2-11ea-8318-47f23eba3e9e.png)
