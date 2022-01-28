import { Logger } from "eyevinn-iaf";

export default class AbstractLogger implements Logger {
    Colors = {
        error: "\x1b[31m",
        info: "\x1b[32m",
        warn: "\x1b[33m",
        verbose: "\x1b[37m",
    };

    private logger(level: string, message: string) {
        if (level === 'verbose' && process.env.NODE_ENV !== 'development') return;
        console.log(`${this.Colors[level]}%s`, `${level}: ${message}`);
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
