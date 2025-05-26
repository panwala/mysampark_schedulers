import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { processImagesForBusiness } from '../services/imageProcessingService'; // Import the new service

const imageProcessingApi = Router();

// Define the API endpoint
imageProcessingApi.post('/process-images', async (req: any, res: any) => {
    const { businessId } = req.body; // Extract businessId from the request body

    if (!businessId) {
        return res.status(400).json({
            success: false,
            message: 'Business ID is required.',
        });
    }

    try {
        await logger.info('📥 Image processing request received', {
            businessId,
            timestamp: new Date().toISOString(),
        });

        // Call the new service to process images for the specific businessId 50 times
        for (let i = 0; i < 50; i++) {
            await processImagesForBusiness(businessId);
            await logger.info(`🔄 Processed images for business ID: ${businessId} - Call ${i + 1}`);
        }

        return res.status(200).json({
            success: true,
            message: 'Image processing started successfully for business ID: ' + businessId,
        });
    } catch (error) {
        await logger.error('❌ Error processing images', {
            error: error.message,
            stack: error.stack,
            businessId,
            timestamp: new Date().toISOString(),
        });
        return res.status(500).json({
            success: false,
            message: 'Error processing images.',
        });
    }
});

export { imageProcessingApi };
