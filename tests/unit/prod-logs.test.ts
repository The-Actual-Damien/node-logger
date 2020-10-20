import * as winston from 'winston';
import { GTLogger } from '@src/index';
import { delay } from 'tests/helpers';
import { expect } from 'chai';
import fs from 'fs';
import tmp from 'tmp';

describe('when logging while configuring the logger in production mode', () => {
    it('contains message and level', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        logger.info('test');
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('info');
        expect(log.message).to.eql('test');
        expect(log.label).to.eql('prod-test');
        file.removeCallback();
    });

    it('adds memory info', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        logger.info('test, 1');
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(parseInt(log?.logMetadata?.memory?.usedMBs, 10)).to.be.greaterThan(0);
        file.removeCallback();
    });

    it('prints custom fields', async () => {
        let requestId = '1';

        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
            additionalInfo: () => {
                return {
                    requestId,
                };
            },
        });
        const logger = GTLogger.logger;
        logger.info('test, 1');
        requestId = '2';
        logger.info('test, 2');
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const lines = contents.toString().split('\n');
        expect(lines).to.have.lengthOf(3);
        expect(lines[2]).to.eql('');

        expect(JSON.parse(lines[0])?.logMetadata.requestId).to.eql('1');
        expect(JSON.parse(lines[1])?.logMetadata.requestId).to.eql('2');
        file.removeCallback();
    });

    it('prints stack traces when an error is passed', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            additionalInfo: () => {
                return {
                    hello: 'world',
                };
            },
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        logger.error(new Error('hey'));
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('error');
        expect(log.message).to.eql('hey');
        expect(log.logMetadata.hello).to.eql('world');
        expect(log.stack.includes('Error: hey\n')).to.eql(true);
        expect(log.stack.includes('/node-logger/tests/unit/prod-logs.test.ts:')).to.eql(true);
        file.removeCallback();
    });

    it('prints stack traces when an error is passed, second pattern', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            additionalInfo: () => {
                return {
                    hello: 'world',
                };
            },
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        logger.error('some error ', new Error('hey'));
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('error');
        expect(log.message).to.eql('some error hey');
        expect(log.logMetadata.hello).to.eql('world');
        expect(log.stack.includes('Error: hey\n')).to.eql(true);
        expect(log.stack.includes('/node-logger/tests/unit/prod-logs.test.ts:')).to.eql(true);
        file.removeCallback();
    });

    it('prints stack traces everytime log.error is called, even if an error object is not passed', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        logger.error('not an error object');
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('error');
        expect(log.message).to.eql('not an error object');
        expect(log.stack.includes('Error: \n')).to.eql(true);
        expect(log.stack.includes('/node-logger/tests/unit/prod-logs.test.ts:')).to.eql(true);
        file.removeCallback();
    });

    it('runs the scrubber function if specified', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
            scrubber: ({ level, message, ...rest }) => {
                if (rest.authorizationHeader) {
                    rest.authorizationHeader = '[REDACTED]';
                }
                if (level === 'info') {
                    message += ' informational';
                }
                return {
                    level,
                    message,
                    ...rest,
                };
            },
        });
        const logger = GTLogger.logger;
        logger.info('test', { authorizationHeader: 'scrub me' });
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('info');
        expect(log.message).to.eql('test informational');
        expect(log.authorizationHeader).to.eql('[REDACTED]');
        file.removeCallback();
    });

    it('scrubs the specified fields', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
        });
        const logger = GTLogger.logger;
        const gtInterview = {
            firstName: 'Stefano',
            lastName: "D'Amico",
            coordinator: {
                firstName: 'Peter',
                lastName: 'Lee',
                email: 'peter@goodtime.io',
            },
            guest: {
                phone: '123-456-7890',
                otherField: 'xyz',
            },
        };
        logger.info('interview', {
            interview: gtInterview,
            scrub: ['firstName', 'lastName', 'email', 'phone', 'guest'],
        });
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('info');
        expect(log.message).to.eql('interview');
        expect(log.interview).to.eql({
            firstName: '[REDACTED]',
            lastName: '[REDACTED]',
            coordinator: {
                firstName: '[REDACTED]',
                lastName: '[REDACTED]',
                email: '[REDACTED]',
            },
            guest: '[REDACTED]',
        });
        file.removeCallback();
    });

    it('scrubs fields specified in the scrubber function', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
            scrubber: ({ level, message, ...rest }) => {
                return {
                    level,
                    message,
                    scrub: ['authorizationHeader'],
                    ...rest,
                };
            },
        });
        const logger = GTLogger.logger;
        logger.info('test', { authorizationHeader: 'scrub me' });
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('info');
        expect(log.message).to.eql('test');
        expect(log.authorizationHeader).to.eql('[REDACTED]');
        file.removeCallback();
    });

    it('logs extra fields', async () => {
        const file = tmp.fileSync();
        GTLogger.reset();
        GTLogger.init({
            name: 'prod-test',
            environment: 'prod',
            transports: [
                new winston.transports.File({
                    filename: file.name,
                }),
            ],
            additionalInfo: () => {
                return {
                    hello: 'world',
                };
            },
            scrubber: ({ level, message, ...rest }) => {
                const ret = {
                    level,
                    message,
                    ...rest,
                    somedata: {
                        field1: rest.fieldRedact1,
                        field2: rest.fieldRedact2,
                    },
                    scrub: ['fieldRedact1', 'fieldRedact2'],
                };
                return ret;
            },
        });
        const logger = GTLogger.logger;
        logger.error('some error', {
            stack: new Error('hello').stack,
            fieldRedact1: 'test1',
            fieldRedact2: 'test2',
            config: {
                some: 'config',
            },
        });
        logger.end();

        await delay(1000);

        const contents = fs.readFileSync(file.name);
        const log = JSON.parse(contents.toString());
        expect(log.level).to.eql('error');
        expect(log.message).to.eql('some error');
        expect(log.label).to.eql('prod-test');
        expect(log.fieldRedact1).to.eql('[REDACTED]');
        expect(log.fieldRedact2).to.eql('[REDACTED]');
        expect(log.somedata.field1).to.eql('test1');
        expect(log.somedata.field2).to.eql('test2');
        expect(log.logMetadata.hello).to.eql('world');
        file.removeCallback();
    });
});
