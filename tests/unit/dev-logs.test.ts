import * as winston from 'winston';
import { GTLogger } from '@src/index';
import { delay } from 'tests/helpers';
import { expect } from 'chai';
import fs from 'fs';
import tmp from 'tmp';

describe('when logging while configuring the logger in dev mode', () => {
    it('colorizes and contains necessary info', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'dev-test',
            environment: 'dev',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        logger.error('test', {
            field1: 'value1',
        });
        logger.end();

        await delay(10);

        const contents = fs.readFileSync(file.name).toString();

        // colorizes
        expect(contents.includes('\u001b[31m')).to.eql(true);

        // contain the message
        expect(contents.includes('test')).to.eql(true);

        // make sure the message indicates the log level
        expect(contents.includes('error')).to.eql(true);

        // make sure additionalInfo shows up
        expect(contents.includes('field1')).to.eql(true);
        expect(contents.includes('value1')).to.eql(true);

        // check stack trace is there
        expect(contents.includes('dev-logs.test.ts')).to.eql(true);
        file.removeCallback();
    });
});
