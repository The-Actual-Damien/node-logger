import * as winston from 'winston';
import { GTLogger } from '@src/index';
import { delay } from 'tests/helpers';
import { expect } from 'chai';
import fs from 'fs';
import tmp from 'tmp';

describe('when logging while configuring the logger in dev mode', () => {
    it('colorizes and logs the timestamp', async () => {
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
        logger.info('test');
        logger.end();

        await delay(10);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('\u001b[32minfo\u001b[39m');
        expect(log.message).to.eql('\u001b[32mtest\u001b[39m');
        expect(log.label).to.eql('dev-test');
        expect(log.timestamp).to.not.be.undefined;
        file.removeCallback();
    });
});
