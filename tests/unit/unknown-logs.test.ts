import { GTLogger } from '@src/index';

describe('when logging without configuring the logger', () => {
    it('does not error', async () => {
        GTLogger.reset();
        const logger = GTLogger.logger;
        logger.info('test');
        logger.end();
        // Ideally, we'd want to check that the log has been emitted
        // to stdout
    });
});
