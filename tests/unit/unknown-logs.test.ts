import * as winston from 'winston';
import { GTLogger } from '@src/index';
import { delay } from 'tests/helpers';
import { expect } from 'chai';
import fs from 'fs';
import tmp from 'tmp';

describe('when logging without configuring the logger', () => {
    it('does not error', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        const logger = GTLogger.logger;
        logger.info('some log', { whats: 'up' });
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('info');
        expect(log.label).to.eql('unknown');
        expect(log.message).to.eql('some log');
        expect(log.whats).to.eql('up');
        file.removeCallback();
    });
});
