export enum SprLogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    OFF = 4
}

// Level gated logger for the speechrecorder library.
// Default level is INFO: debug output is suppressed unless configured otherwise.
// Warnings and errors are always emitted (unless the level is OFF).
export class SprLogger {

    static level: SprLogLevel = SprLogLevel.INFO;

    static init(level: SprLogLevel | undefined | null): void {
        if (level !== undefined && level !== null) {
            SprLogger.level = level;
        }
    }

    static debug(...args: unknown[]): void {
        if (SprLogger.level <= SprLogLevel.DEBUG) {
            console.debug(...args);
        }
    }

    static info(...args: unknown[]): void {
        if (SprLogger.level <= SprLogLevel.INFO) {
            console.info(...args);
        }
    }

    static warn(...args: unknown[]): void {
        if (SprLogger.level <= SprLogLevel.WARN) {
            console.warn(...args);
        }
    }

    static error(...args: unknown[]): void {
        if (SprLogger.level <= SprLogLevel.ERROR) {
            console.error(...args);
        }
    }
}
