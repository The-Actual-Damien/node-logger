import { SentryConfig, buildSentryTransport } from '@src/transports/sentry';
import { expect } from 'chai';

describe('sentry transport', function () {
    it('should return a sentry transport when passed a sentry config', function () {
        const mockSentryConfig = {
            sentryDsn: '',
            environment: 'test',
            release: 'test',
        } as SentryConfig;

        const transport = buildSentryTransport(mockSentryConfig);
        expect(transport).to.not.equal(null);
        expect(transport.constructor.name).to.be.eq('SentryTransport');
        expect(transport.level).to.equal('error');
    });
});
