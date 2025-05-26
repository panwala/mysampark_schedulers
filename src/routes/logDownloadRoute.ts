import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import express from 'express';

const logDownloadRoute = Router();
const app = express();

// List all available log files
logDownloadRoute.get('/logs', async (req: Request, res: Response) => {
    try {
        const logDir = path.join(__dirname, '..', '..', 'logs');
        const files = fs.readdirSync(logDir)
            .filter(file => file.endsWith('.log'))
            .map(file => {
                const filePath = path.join(logDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified.getTime() - a.modified.getTime());

        res.json({
            success: true,
            files
        });
    } catch (error) {
        await logger.error('Error listing log files', error);
        res.status(500).json({
            success: false,
            message: 'Error listing log files'
        });
    }
});

// Download a specific log file
logDownloadRoute.get('/logs/download/:filename', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        
        // Security check - ensure filename only contains safe characters
        if (!filename.match(/^[\w\-. ]+\.log$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename'
            });
        }

        const logDir = path.join(__dirname, '..', '..', 'logs');
        const filePath = path.join(logDir, filename);

        // Check if file exists and is within logs directory
        if (!fs.existsSync(filePath) || !filePath.startsWith(logDir)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Log the download
        await logger.info(`Log file download requested`, { filename, ip: req.ip });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        return res; // Ensure to return the response object
    } catch (error) {
        await logger.error('Error downloading log file', error);
        return res.status(500).json({
            success: false,
            message: 'Error downloading log file'
        });
    }
});

export { logDownloadRoute }; 