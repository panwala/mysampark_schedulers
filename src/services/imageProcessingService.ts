// src/services/imageProcessingService.ts

import { fetchAllUsers } from '../routes/demo'; // Import the fetchAllUsers function
import { generateImageBuffer } from '../routes/demo'; // Import your image generation logic
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
const path = require("path");
const https = require("https");
import { Image } from "canvas";
const { createCanvas, loadImage, registerFont } = require("canvas");
import { logger } from '../utils/logger';

/// Define font paths
const fontPath = "./public/font";

registerFont(`${fontPath}/montserrat/Montserrat-Regular.ttf`, {
  family: "montserrat",
  weight: "normal",
});
registerFont(`${fontPath}/montserrat/Montserrat-Bold.ttf`, {
  family: "montserrat",
  weight: "bold",
});
registerFont(`${fontPath}/montserrat/Montserrat-Medium.ttf`, {
  family: "montserrat",
  weight: "500",
});
registerFont(`${fontPath}/montserrat/Montserrat-Light.ttf`, {
  family: "montserrat",
  weight: "300",
});
registerFont(`${fontPath}/montserrat/Montserrat-Thin.ttf`, {
  family: "montserrat",
  weight: "100",
});
registerFont(`${fontPath}/montserrat/Montserrat-ExtraBold.ttf`, {
  family: "montserrat",
  weight: "800",
});
registerFont(`${fontPath}/montserrat/Montserrat-SemiBold.ttf`, {
  family: "montserrat",
  weight: "600",
});
registerFont(`${fontPath}/montserrat/Montserrat-Black.ttf`, {
  family: "montserrat",
  weight: "900",
});
const backgroundImageCache = new Map();
const backgroundImagePostIdCache = new Map();
async function getBackgroundImageUrl(bussiness_id: Number): Promise<any> {
  try {
    // at the top of your file, create a cache map

    // if we've already fetched for this ID, return the cached promise/result
    if (backgroundImageCache.has(bussiness_id)) {
      let cacheBusinessBackgroundImageResponse =
        backgroundImageCache.get(bussiness_id);
      backgroundImageCache.delete(bussiness_id);
      return cacheBusinessBackgroundImageResponse;
    }
    const res = await axios.post(
      "https://testadmin.mysampark.com/api/imageapi",
      { bussiness_id: bussiness_id }
    );
    backgroundImagePostIdCache.set(
      `${bussiness_id}-post_id`,
      res.data.data.post_id
    );
    backgroundImageCache.set(bussiness_id, res.data);
    return (
      res.data || {
        story:
          "https://testadmin.mysampark.com/images/15/story/67da6410d8d52_3.png",
        post: "https://testadmin.mysampark.com/images/15/post/67da637ea1787_3.png",
        caption:
          "Success is a mindset, not a destination.  Transform your attitude, transform your results. #TechSolutions #SuccessMindset ",
      }
    );
  } catch (error) {
    console.error("Error fetching background image:", error);
    return null;
  }
}

async function getWhatsappMessageCaption(bussiness_id: Number): Promise<any> {
  try {
    const res = await axios.post(
      "https://testadmin.mysampark.com/api/imageapi",
      { bussiness_id: bussiness_id }
    );
    // console.log("ress", res.data.data);
    return (
      res.data.data || {
        caption:
          "Success is a mindset, not a destination.  Transform your attitude, transform your results. #TechSolutions #SuccessMindset ",
      }
    );
  } catch (error) {
    console.error("Error fetching background image:", error);
    return null;
  }
}

// ---- A new function for changing icons' color ---

async function recolorImage(
  imageUrl: string,
  targetColor: string
): Promise<Image> {
  // Load original image
  const original = await loadImage(imageUrl);

  // Create canvas
  const canvas = createCanvas(original.width, original.height);
  const ctx = canvas.getContext("2d");

  // Draw original image
  ctx.drawImage(original, 0, 0);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert target color to RGB
  const tempCanvas = createCanvas(1, 1);
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.fillStyle = targetColor;
  tempCtx.fillRect(0, 0, 1, 1);
  const [tr, tg, tb] = tempCtx.getImageData(0, 0, 1, 1).data;

  // Replace all non-transparent pixels
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      // Only modify non-transparent pixels
      data[i] = tr; // Red
      data[i + 1] = tg; // Green
      data[i + 2] = tb; // Blue
    }
  }

  // Put modified data back
  ctx.putImageData(imageData, 0, 0);

  // Convert to Image
  return loadImage(canvas.toBuffer("image/png"));
}
export async function processImagesForBusiness(businessId: number) {
    try {
        const startTime = new Date();
        await logger.info('🔄 Starting image processing for business ID: ' + businessId, {
            timestamp: new Date().toISOString(),
        });

        const users = await fetchAllUsers();
        // console.log("users", users);
        const filteredUsers = users.filter(user => {
          console.log("user", user.business.id == Number(businessId));
          return user.business.id == Number(businessId)});
          console.log("filteredUsers", filteredUsers);
        if (filteredUsers.length === 0) {
            await logger.warn('⚠️ No users found for business ID: ' + businessId, {
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const outputDir = path.join(__dirname, "output");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
          await logger.info('📁 Created output directory', { 
            outputDir,
            timestamp: new Date().toISOString()
          });
        }
    
        function getCurrentTimeIST() {
          return new Intl.DateTimeFormat("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Kolkata",
          }).format(new Date());
        }
    
        function getCurrentTimeISTPlus10() {
          const now = new Date();
          const istNow = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          istNow.setMinutes(istNow.getMinutes() + 10);
          return new Intl.DateTimeFormat("en-GB", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Kolkata",
          }).format(istNow);
        }
    
        const currentTime = getCurrentTimeIST();
        await logger.info('⏰ Current processing time (IST)', { 
          currentTime,
          timestamp: new Date().toISOString()
        });
        
        let processedCount = 0;
        let successCount = 0;
        let failureCount = 0;
    
        for (const user of users) {
          processedCount++; // Increment processed count at the start of each user
          try {
            const business = user?.business;
    
            if (!business || !business.id || business.whatsapp_number == null) {
              const businessId = business?.id ?? "unknown";
              const reason = !business
                ? "Missing business object"
                : !business.id
                ? "Missing business ID"
                : business.whatsapp_number == null
                ? "Missing WhatsApp number"
                : "Unknown reason";
    
              await logger.warn('⚠️ Skipping business - Invalid configuration', { 
                businessId,
                userId: user.id,
                reason,
                timestamp: new Date().toISOString()
              });
              failureCount++;
              continue;
            }
    
            await logger.info('🏢 Processing business', { 
              businessId: business.id,
              userId: user.id,
              businessName: business.business_name,
              whatsappNumber: business.whatsapp_number,
              timestamp: new Date().toISOString()
            });
    
            // Fetch frame data
            await logger.info('🎨 Fetching frame data', { businessId: business.id });
            const frameResponse = await axios.post(
              "https://testadmin.mysampark.com/api/display_bussiness_frame",
              { business_id: business.id }
            ).catch(async (error) => {
              await logger.error('❌ Failed to fetch frame data', {
                businessId: business.id,
                error: error.message,
                response: error.response?.data,
                timestamp: new Date().toISOString()
              });
              throw error;
            });
    
            const customFrames = {
              data: frameResponse.data?.data,
              line_content: frameResponse.data?.line_content,
              globalfont: frameResponse.data?.globalfont,
            };
    
            if (
              !Array.isArray(customFrames.data) ||
              customFrames.data.length === 0 ||
              !customFrames.line_content ||
              !Array.isArray(customFrames.globalfont) ||
              customFrames.globalfont.length === 0
            ) {
              await logger.error('❌ Invalid frame data structure', { 
                businessId: business.id,
                customFrames,
                timestamp: new Date().toISOString()
              });
              failureCount++;
              continue;
            }

    
            let captionResponse = await getWhatsappMessageCaption(business.id);
            await logger.info('📝 Retrieved caption', { 
              businessId: business.id,
              caption: captionResponse,
              timestamp: new Date().toISOString()
            });
    
            // Generate and process images
            for (let j = 0; j <= 1; j++) {
              const imageType = j === 0 ? 'story' : 'post';
              await logger.info(`🎨 Generating ${imageType} image`, { 
                businessId: business.id,
                imageNumber: j + 1,
                timestamp: new Date().toISOString()
              });
              
              try {
                const buffer = await generateImageBuffer(user, customFrames, business, j);
                if (!buffer) {
                    throw new Error('Image buffer generation failed');
                }
                const filename = `${Math.random()}user-${business.id}-${business.id}.png`;
                const outputPath = path.join(outputDir, filename);
                fs.writeFileSync(outputPath, buffer);
                
                await logger.success(`✅ ${imageType} image generated`, { 
                    businessId: business.id,
                    outputPath,
                    timestamp: new Date().toISOString()
                });

              } catch (imageError) {
                await logger.error(`❌ Error processing ${imageType} image`, {
                  businessId: business.id,
                  error: imageError.message,
                  stack: imageError.stack,
                  timestamp: new Date().toISOString(),
                  customFrames,
                  business,
                  user
                  
                });
                failureCount++;
                continue;
              }
            }
            
            successCount++;
    
          } catch (businessError) {
            await logger.error('❌ Business processing failed', {
              businessId: user?.business?.id,
              userId: user?.id,
              error: businessError.message,
              stack: businessError.stack,
              timestamp: new Date().toISOString()
            });
            failureCount++;
          }
        }
    
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
        await logger.info('🏁 Batch processing completed', {
          totalProcessed: processedCount,
          successful: successCount,
          failed: failureCount,
          durationSeconds: duration,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        });
    } catch (error) {
        await logger.error('❌ Error processing images for business ID: ' + businessId, {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
    }
}