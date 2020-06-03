import dotenv from 'dotenv';
dotenv.config();

process.on('unhandledRejection', (error) => {
    console.error(error); // This prints error with stack included (as for normal errors)
    throw error; // Following best practices re-throw error and let the process exit with error code
});
