import * as winston from 'winston';

function getMemoryUsageMB() {
    return (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(0);
}

// Make memory usage information available in every log message.
const memoryFormat = winston.format((info) => {
    info = {
        ...info,
        logMetadata: {
            ...info.logMetadata,
            memory: {
                usedMBs: getMemoryUsageMB(),
            },
        },
    };
    return info;
});

export default memoryFormat;
