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
* Optional Sentry transport for errors
* Utility that makes scrubbing sensitive fields easier

# Usage
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
```

```ts
/// any-other-file-in-project.ts
import log from '@goodtimeio/node-logger';

log.error("error");
log.warn("warning ");
log.info("informational");
log.verbose("verbose");
log.debug("debug");
log.silly("silly");
```

# Screenshots of logs in dev
![image](https://user-images.githubusercontent.com/18729755/83687116-ef8c5500-a5b0-11ea-8482-6920e6de0cf5.png)

![image](https://user-images.githubusercontent.com/18729755/83687165-fc10ad80-a5b0-11ea-8ea3-61aad20e4097.png)

# Screenshot of logs being queried in SumoLogic
![image](https://user-images.githubusercontent.com/18729755/83688246-b2c15d80-a5b2-11ea-8318-47f23eba3e9e.png)

# TODO: Testcases
