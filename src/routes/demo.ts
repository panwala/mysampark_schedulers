// filename: cronImageGenerator.js

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

async function updateUserPostIdOnServer(
  user_id: Number,
  post_id: Number,
  status: Boolean,
  bussiness_id: Number,
  new_post_schedult_time?: String
): Promise<any> {
  try {
    console.log("user_id", user_id);
    console.log("post_id", post_id);
    let res;
    if (!status) {
      res = await axios.post(
        "https://testadmin.mysampark.com/api/store_user_post",
        {
          user_id: user_id,
          post_id: post_id,
          status,
          bussiness_id,
          next_image_send_time: new_post_schedult_time,
        }
      );
    } else {
      res = await axios.post(
        "https://testadmin.mysampark.com/api/store_user_post",
        { user_id: user_id, post_id: post_id, status, bussiness_id }
      );
    }
    // console.log("updateUserPostIdOnServer", res);
    return res;
  } catch (error) {
    console.error("Error Updating User PostId on Server:", error);
    return null;
  }
}
// Function to send WhatsApp message
const sendWhatsAppTemplate = async (
  phoneNumber: any,
  imageUrl: string,
  caption: any
) => {
  function unicodeEscape(str) {
    return str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (char) {
      const high = char.charCodeAt(0);
      const low = char.charCodeAt(1);
      const codePoint = (high - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
      return "\\u{" + codePoint.toString(16) + "}";
    });
  }

  const headers = {
    "Content-Type": "application/json; charset=UTF-8",
    Authorization: "Bearer OQW891APcEuT47TnB4ml0w",
  };
  // console.log("imageUrl", imageUrl);
  console.log("caption in sendWhatsAppTemplate ", caption);
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
    type: "template",
    template: {
      name: "post_delivery_notification",
      language: { code: "en" },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: imageUrl,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: caption.bussiness_name,
            },
            {
              type: "text",
              text: caption.category_name,
            },
            {
              type: "text",
              text: caption.caption.replace(/\uFFFD/g, ""),
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(
      "https://cloudapi.wbbox.in/api/v1.0/messages/send-template/918849987778",
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        redirect: "follow",
      }
    );

    const result: any = await response.json(); // 👈 parse response as JSON
    console.log(`📤 WhatsApp response:`, result);
    console.log(`📤 WhatsApp response data:`, result.success);
    return result.success || true;
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
    return false;
  }
};

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

// 🎨 Image rendering logic (reusable)

const generateImageBuffer = async (
  singleuserData: any,
  actualframesData: {
    data: any; // array of frames
    line_content: any; // corrected path
    globalfont: any;
  },
  businessDatas: any,
  counter: any
) => {
  try {
    const framesData = actualframesData;
    const userData = singleuserData;

    // Extract necessary data from frames and user input
    const lineContent = framesData.line_content;
    const globalFont = framesData.globalfont;
    const frameData = framesData.data[0];
    const framesTextColour = frameData.frames_text_colour;
    const framesVariantData = frameData.frames_varinat[0];
    const framesVariantLines = framesVariantData.framesvariantline;
    const fontFamily = frameData.font_type || "montserrat"; // Default font family

    // Prepare business data array in a specific order
    const businessData = [
      businessDatas.business_name,
      businessDatas.mobile_no,
      businessDatas.mobile_no_2,
      businessDatas.instragram_id,
      businessDatas.email,
      businessDatas.address,
      businessDatas.website,
    ];

    // Load background image (story or post based on counter)
    const backgroundImageUrl = await getBackgroundImageUrl(businessDatas.id);
    const backgroundImage = await loadImage(
      counter == 0
        ? backgroundImageUrl.data.story
        : backgroundImageUrl.data.post
    );

    // Create base canvas and draw background
    const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
    const mainCtx = canvas.getContext("2d");
    mainCtx.drawImage(backgroundImage, 0, 0);

    // Create high-resolution overlay canvas for better quality
    const scale = 2;
    const overlayCanvas = createCanvas(
      canvas.width * scale,
      canvas.height * scale
    );
    const ctx = overlayCanvas.getContext("2d");
    ctx.scale(scale, scale);

    // Draw the frame overlay at the bottom of the canvas
    const frameOverlayImage = await loadImage(framesVariantData.image_url);
    ctx.drawImage(
      frameOverlayImage,
      0,
      canvas.height - frameOverlayImage.height
    );

    // Load and draw business logo, centered at the top
    const logoImage = await loadImage(
      businessDatas.logo_image_url ||
        "https://img.freepik.com/premium-vector/water-logo-design-concept_761413-7077.jpg?semt=ais_hybrid&w=250"
    );
    const desiredLogoHeight = 150;
    const aspectRatio = logoImage.width / logoImage.height;
    const calculatedWidth = desiredLogoHeight * aspectRatio;
    const logoXPosition = canvas.width / 2 - calculatedWidth / 2;
    ctx.drawImage(
      logoImage,
      logoXPosition,
      50,
      calculatedWidth,
      desiredLogoHeight
    );

    // Calculate vertical offset for text based on overlay height
    let bottomTextContentHeight = canvas.height - frameOverlayImage.height;

    // Icon mapping from frame data
    const icons = {
      email: frameData.frame_icon.email_icon,
      mobile1: frameData.frame_icon.mobile_no_1_icon,
      mobile2: frameData.frame_icon.mobile_no_2_icon,
      location: frameData.frame_icon.location_icon,
      website: frameData.frame_icon.website_icon,
      instagram: frameData.frame_icon.instragram_icon,
    };

    // Prepare fonts for each business info type
    const fontsData = [
      globalFont.find((f: { type: string }) => f.type === "name"),
      globalFont.find((f: { type: string }) => f.type === "mobile_no_1"),
      globalFont.find((f: { type: string }) => f.type === "mobile_no_2"),
      globalFont.find((f: { type: string }) => f.type === "instagram"),
      globalFont.find((f: { type: string }) => f.type === "email"),
      globalFont.find((f: { type: string }) => f.type === "address"),
      globalFont.find((f: { type: string }) => f.type === "website"),
    ].filter((f) => f !== undefined);

    // Extract color toggles for each line (Y = use color 'y', otherwise 'x')
    const textColours = [
      framesTextColour.line1,
      framesTextColour.line2,
      framesTextColour.line3,
      framesTextColour.line4,
      framesTextColour.line5,
    ].filter((f) => f !== null);

    // Group business data lines by line index
    const groupOfLines = [
      lineContent.line1,
      lineContent.line2,
      lineContent.line3,
      lineContent.line4,
      lineContent.line5,
    ].filter((f) => f !== null);

    // Loop through each line layout configuration
    for (const [index, row] of framesVariantLines.entries()) {
      let fontSize = +fontsData[0]?.font_size || 20;
      const fontWeight = "normal";
      const iconSize = fontSize * 2;

      // Set default font and color for this line
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const currentTextColor =
        textColours[index] === "Y" ? frameData.y : frameData.x;
      ctx.fillStyle = currentTextColor;

      // Get the business data values for this line
      const linesOfCurrentRow = groupOfLines[index].split(",");
      const texts = linesOfCurrentRow
        .map((line: string | number) => {
          const lineText = businessData[+line - 1];
          return { lineNo: +line, text: lineText || "" };
        })
        .filter((f: null) => f !== null);

      // Calculate total width needed for text and icons
      const totalTextWidth =
        index === 0
          ? texts.reduce(
              (sum: any, text: { text: any }) =>
                sum + ctx.measureText(text.text).width,
              0
            )
          : texts.reduce(
              (sum: any, text: { text: any }) =>
                sum + ctx.measureText(text.text).width,
              0
            ) + iconSize;

      const spacing = (+row.width - totalTextWidth) / (texts.length + 1);
      let xPos = +row.x + spacing;

      // Draw each text + optional icon
      for (const text of texts) {
        const getFontSize = fontsData[text.lineNo - 1];
        const fontWeight = +getFontSize.font_weight || "normal";
        ctx.font = `${fontWeight} ${+getFontSize.font_size}px ${fontFamily}`;
        fontSize = +getFontSize.font_size;

        let icon: Image | null = null;

        // Determine which icon to draw based on line number
        switch (text.lineNo) {
          case 2:
            icon = await recolorImage(icons.mobile1, currentTextColor);
            break;
          case 3:
            icon = await recolorImage(icons.mobile2, currentTextColor);
            break;
          case 4:
            icon = await recolorImage(icons.instagram, currentTextColor);
            break;
          case 5:
            icon = await recolorImage(icons.email, currentTextColor);
            break;
          case 6:
            icon = await recolorImage(icons.location, currentTextColor);
            break;
          case 7:
            icon = await recolorImage(icons.website, currentTextColor);
            break;
          default:
            icon = null;
        }

        // Calculate vertical position for current line
        const yPos =
          +row.y + +row.height / 2 + fontSize / 3 + bottomTextContentHeight;
        const textWidth = ctx.measureText(text.text).width;

        if (icon) {
          // Draw icon and then text with spacing
          ctx.drawImage(
            icon,
            +xPos,
            +yPos - iconSize / 1.5,
            iconSize,
            iconSize
          );
          ctx.fillText(text.text, +xPos + iconSize, +yPos);
          xPos += textWidth + spacing;
        } else {
          // Draw text only
          ctx.fillText(text.text, +xPos, +yPos);
          xPos += textWidth + spacing;
        }
      }
    }

    // Merge overlay content onto the base canvas
    mainCtx.drawImage(
      overlayCanvas,
      0,
      0,
      overlayCanvas.width,
      overlayCanvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Return the final image buffer
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.log("error ", error);
    console.error("error", error.message);
  }
};
async function uploadImageToAPI(
  filePath: string,
  apiDomainUrl: string,
  channelNumber: string,
  apiKey: string
) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // ⚠️ turns off cert checking
    });
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      `${apiDomainUrl}/api/v1.0/uploads/${channelNumber}`,
      form,
      {
        httpsAgent,
        proxy: false, // just to be double‑sure
        maxBodyLength: Infinity, // allow very large uploads
        timeout: 60000, // 60 s timeout
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders(), // ✅ works with correct FormData
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.log("error", error);
    console.error(`❌ Upload failed: ${error.message}`);
    throw error;
  }
}
// 🌐 Fetch all users
async function fetchAllUsers() {
  const response = await axios.get(
    "https://testadmin.mysampark.com/api/bussiness_list"
  );
  return response.data.data;
}

// Add image upload function
async function uploadToPostImages(imagePath: string): Promise<string> {
  try {
    const originalFilename = path.basename(imagePath);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}-${originalFilename}`;
    const destinationPath = path.join(__dirname, '..', '..', 'public', 'uploads', uniqueFilename);
    
    await logger.info('Starting file upload', { originalFilename, uniqueFilename });
    
    fs.copyFileSync(imagePath, destinationPath);
    
    const serverAddress = `https://cron.mysampark.com`;
    
    setTimeout(async () => {
      try {
        fs.unlinkSync(imagePath);
        fs.unlinkSync(destinationPath);
        await logger.info('Files cleaned up successfully', { imagePath, destinationPath });
      } catch (cleanupError) {
        await logger.error('Error during file cleanup', cleanupError);
      }
    }, 10000);

    const publicUrl = `${serverAddress}/uploads/${uniqueFilename}`;
    await logger.success('File uploaded successfully', { publicUrl });
    
    return publicUrl;
  } catch (error) {
    await logger.error('Error saving image', error);
    throw error;
  }
}
// 🧠 Main runner
async function generateForAllUsers() {
  try {
    const users = await fetchAllUsers();
    await logger.info(`Starting image generation for ${users.length} users`);

    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
      await logger.info('Created output directory', { outputDir });
    }

    function getCurrentTimeIST() {
      return new Intl.DateTimeFormat("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata", // Set to IST
      }).format(new Date());
    }
    function getCurrentTimeISTPlus10() {
      // Get current time in IST
      const now = new Date();

      // Convert current time to IST by using toLocaleString and re-parsing it
      const istNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      // Add 10 minutes
      istNow.setMinutes(istNow.getMinutes() + 10);

      // Format the updated time
      return new Intl.DateTimeFormat("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(istNow);
    }

    const currentTime = getCurrentTimeIST();
    await logger.info('Current time (IST)', { currentTime });
    
    let business;
    for (const user of users) {
      try {
        business = user?.business;

        if (!business || !business.id || business.whatsapp_number == null) {
          const businessId = business?.id ?? "unknown";
          const reason = !business
            ? "Missing business object"
            : !business.id
            ? "Missing business ID"
            : business.whatsapp_number == null
            ? "Missing WhatsApp number"
            : "Unknown reason";

          await logger.warn(`Skipping business`, { businessId, reason });
          continue;
        }

        await logger.info('Processing business', { 
          businessId: business.id,
          userId: user.id,
          businessName: business.business_name 
        });

        const frameResponse = await axios.post(
          "https://testadmin.mysampark.com/api/display_bussiness_frame",
          { business_id: business.id }
        );

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
          await logger.error('Missing frame data', { businessId: business.id });
          continue;
        }

        if (
          business.post_schedult_time !== currentTime &&
          business.postUserSend !== currentTime
        ) {
          await logger.info('Skipping - not scheduled for now', { 
            businessId: business.id,
            scheduledTime: business.post_schedult_time,
            currentTime 
          });
          continue;
        }

        let captionResponse = await getWhatsappMessageCaption(business.id);
        await logger.info('Retrieved caption', { businessId: business.id, caption: captionResponse });

        for (let j = 0; j <= 1; j++) {
          await logger.info(`Generating image ${j + 1}/2`, { businessId: business.id });
          
          const buffer = await generateImageBuffer(user, customFrames, business, j);
          const filename = `${Math.random()}user-${business.id}-${business.id}.png`;
          const outputPath = path.join(outputDir, filename);
          fs.writeFileSync(outputPath, buffer);
          await logger.success('Image generated', { businessId: business.id, outputPath });

          let uploadResponse = await uploadToPostImages(outputPath);
          await logger.success('Image uploaded', { businessId: business.id, url: uploadResponse });

          let whatsaappAPIresponse = await sendWhatsAppTemplate(
            // "919624863068",
            business.whatsapp_number || "919624863068",
            uploadResponse,
            captionResponse
          );
          await logger.info('WhatsApp message sent', { 
            businessId: business.id,
            success: whatsaappAPIresponse,
            phone: business.whatsapp_number || "919624863068"
          });

          if (backgroundImagePostIdCache.has(`${business.id}-post_id`) && j > 0) {
            if (!whatsaappAPIresponse) {
              await updateUserPostIdOnServer(
                business.user_id,
                backgroundImagePostIdCache.get(`${business.id}-post_id`),
                false,
                business.id,
                getCurrentTimeISTPlus10()
              );
              await logger.warn('WhatsApp send failed, updated server with next attempt time', { 
                businessId: business.id,
                nextAttempt: getCurrentTimeISTPlus10() 
              });
            } else {
              await updateUserPostIdOnServer(
                business.user_id,
                backgroundImagePostIdCache.get(`${business.id}-post_id`),
                true,
                business.id
              );
              await logger.success('Updated server with successful send', { businessId: business.id });
            }
            backgroundImagePostIdCache.delete(`${business.id}-post_id`);
            await logger.info('Cleared post ID from cache', { businessId: business.id });
          }
        }
      } catch (err) {
        await logger.error(`Error processing business ${business?.id}`, err);
      }
    }
  } catch (err) {
    await logger.error('Error in main process', err);
  }
}

// Cron job scheduled for every minute
cron.schedule("* * * * *", () => {
  logger.info('🚀 Cron job started', { timestamp: new Date().toLocaleString() })
    .then(() => generateForAllUsers())
    .catch(async (err) => {
      await logger.error('Cron job failed', err);
    });
});

