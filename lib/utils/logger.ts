import { Logger } from "eyevinn-iaf";

export default class AbstractLogger implements Logger {
    colors = {
        error: "\x1b[31m",   // red
        info: "\x1b[32m",    // green
        warn: "\x1b[33m",    // yellow
        verbose: "\x1b[37m", // white
    };

    private logger(level: string, message: string) {
        console.log(`${this.colors[level]}%s`, `${level}: ${message}`);
    }

    verbose(message: string) {
        this.logger('verbose', message);
    }

    info(message: string) {
        this.logger('info', message);
    }

    warn(message: string) {
        this.logger('warn', message);
    }

    error(message: string) {
        this.logger('error', message);
    }
}
