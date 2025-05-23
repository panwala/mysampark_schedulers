import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_LOG_FILES = 30; // Keep last 30 days of logs
  private currentFileSize: number;

  constructor() {
    this.logDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.currentLogFile = this.getLogFileName();
    this.currentFileSize = this.getCurrentFileSize();
    this.cleanOldLogs();
  }

  private getCurrentFileSize(): number {
    try {
      return fs.existsSync(this.currentLogFile) ? fs.statSync(this.currentLogFile).size : 0;
    } catch (error) {
      return 0;
    }
  }

  private getLogFileName(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(this.logDir, `${year}-${month}-${day}.log`);
  }

  private async compressFile(filePath: string): Promise<void> {
    const gzipFilePath = `${filePath}.gz`;
    
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(gzipFilePath);
      const gzip = zlib.createGzip();

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', () => {
          fs.unlinkSync(filePath); // Delete original file after compression
          resolve();
        })
        .on('error', reject);
    });
  }

  private async cleanOldLogs(): Promise<void> {
    try {
      const files = fs.readdirSync(this.logDir);
      const logFiles = files
        .filter(file => file.endsWith('.log') || file.endsWith('.log.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          date: new Date(file.split('.')[0])
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Keep only the last MAX_LOG_FILES files
      const filesToDelete = logFiles.slice(this.MAX_LOG_FILES);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
      }

      // Compress files older than today
      const today = new Date().toISOString().split('T')[0];
      const filesToCompress = logFiles
        .filter(file => !file.name.endsWith('.gz') && file.date.toISOString().split('T')[0] < today);

      for (const file of filesToCompress) {
        await this.compressFile(file.path);
      }
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    if (data) {
      if (data instanceof Error) {
        logMessage += `\nError: ${data.message}\nStack: ${data.stack}`;
      } else {
        logMessage += `\n${JSON.stringify(data, null, 2)}`;
      }
    }
    return logMessage + '\n';
  }

  private async rotateLog(): Promise<void> {
    if (this.currentFileSize >= this.MAX_FILE_SIZE) {
      const rotatedFilename = `${this.currentLogFile}.${Date.now()}`;
      fs.renameSync(this.currentLogFile, rotatedFilename);
      await this.compressFile(rotatedFilename);
      this.currentFileSize = 0;
    }
  }

  private async writeToFile(message: string) {
    try {
      // Check if we need to create a new log file for a new day
      const newLogFile = this.getLogFileName();
      if (newLogFile !== this.currentLogFile) {
        if (fs.existsSync(this.currentLogFile)) {
          await this.compressFile(this.currentLogFile);
        }
        this.currentLogFile = newLogFile;
        this.currentFileSize = 0;
      }

      // Check if we need to rotate the current log file
      await this.rotateLog();

      // Append the message
      fs.appendFileSync(this.currentLogFile, message);
      this.currentFileSize += Buffer.byteLength(message);

    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  async info(message: string, data?: any) {
    const formattedMessage = this.formatMessage('INFO', message, data);
    console.log(formattedMessage);
    await this.writeToFile(formattedMessage);
  }

  async error(message: string, error?: any) {
    const formattedMessage = this.formatMessage('ERROR', message, error);
    console.error(formattedMessage);
    await this.writeToFile(formattedMessage);
  }

  async warn(message: string, data?: any) {
    const formattedMessage = this.formatMessage('WARN', message, data);
    console.warn(formattedMessage);
    await this.writeToFile(formattedMessage);
  }

  async success(message: string, data?: any) {
    const formattedMessage = this.formatMessage('SUCCESS', message, data);
    console.log(formattedMessage);
    await this.writeToFile(formattedMessage);
  }
}

export const logger = new Logger(); 