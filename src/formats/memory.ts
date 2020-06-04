import * as winston from 'winston';

function getMemoryUsageMB() {
    return (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(0);
}

function getFreeMemoryMB() {
    return ((process.memoryUsage().heapTotal - process.memoryUsage().heapUsed) / (1024 * 1024)).toFixed(0);
}

const memoryFormat = winston.format((info) => {
    info = {
        ...info,
        metadata: {
            ...info.metadata,
            memory: {
                usedMBs: getMemoryUsageMB(),
                freeMBs: getFreeMemoryMB(),
            },
        },
    };
    return info;
});

export default memoryFormat;
