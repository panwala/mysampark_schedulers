// filename: cronImageGenerator.js

const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
const path = require("path");
const https = require("https");
import { Image } from "canvas";
const { createCanvas, loadImage, registerFont } = require("canvas");
const express = require('express');
const app = express();
const os = require('os');

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
  apiKey: string,
  maxRetries = 3
) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Validate file exists and is not too large
      const stats = await fs.promises.stat(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      if (fileSizeInMB > 5) { // Reduced to 5MB to be safer
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        timeout: 60000 // Increased timeout to 60 seconds
      });

      const form = new FormData();
      const fileStream = fs.createReadStream(filePath);
      
      // Add error handler for file stream
      fileStream.on('error', (err) => {
        throw new Error(`File stream error: ${err.message}`);
      });

      form.append("file", fileStream, {
        filename: path.basename(filePath),
        contentType: 'image/png',
        knownLength: stats.size
      });

      const config = {
        httpsAgent,
        proxy: false,
        maxBodyLength: 10 * 1024 * 1024, // Increased to 10MB
        maxContentLength: 10 * 1024 * 1024,
        timeout: 60000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders(),
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress (Attempt ${attempt + 1}/${maxRetries}): ${percentCompleted}%`);
        }
      };

      console.log(`Starting file upload (Attempt ${attempt + 1}/${maxRetries})...`);
      console.log('Upload URL:', `${apiDomainUrl}/api/v1.0/uploads/${channelNumber}`);
      
      // Add validation for API domain and channel number
      if (!apiDomainUrl.startsWith('http')) {
        throw new Error('Invalid API domain URL');
      }
      
      if (!channelNumber.match(/^\d+$/)) {
        throw new Error('Invalid channel number format');
      }

      const response = await axios.post(
        `${apiDomainUrl}/api/v1.0/uploads/${channelNumber}`,
        form,
        config
      );

      // Log the complete response for debugging
      console.log('Upload Response:', JSON.stringify(response.data, null, 2));

      if (!response.data?.success) {
        throw new Error('Upload failed: ' + (response.data?.statusDesc || 'Unknown error'));
      }

      console.log('Upload completed successfully');

      if (!response.data?.data?.ImageUrl) {
        throw new Error('Invalid response format from upload API');
      }

      // Clean up the file after successful upload
      try {
        await fs.promises.unlink(filePath);
        console.log('Temporary file cleaned up:', filePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError);
      }

      return response.data;

    } catch (error: any) {
      attempt++;
      
      // Log detailed error information
      console.error('Upload Error Details:', {
        attempt,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config
      });

      // Handle specific error cases
      if (error.code === 'ENOENT') {
        throw new Error('File not found: ' + filePath);
      }
      
      if (error.response?.status === 413) {
        throw new Error('File size too large. Please reduce the image size.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }

      // For server errors (500) and network errors, retry if attempts remain
      if (attempt < maxRetries && (
        error.response?.status === 500 || 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNABORTED'
      )) {
        console.log(`Retrying upload after error (Attempt ${attempt}/${maxRetries})...`);
        // Add exponential backoff delay with jitter
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }

      // If we've exhausted all retries or hit a non-retryable error, throw
      throw new Error(
        `Upload failed after ${attempt} attempts: ${error.message}`
      );
    }
  }
  
  throw new Error(`Upload failed after ${maxRetries} attempts`);
}

async function uploadImageToServer(filePath: string): Promise<string> {
  try {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    form.append("image", fileStream, {
      filename: path.basename(filePath),
      contentType: 'image/png'
    });

    const response = await axios.post(
      "https://testadmin.mysampark.com/api/upload_image",
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Accept': 'application/json'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    if (!response.data?.success) {
      throw new Error('Upload failed: ' + (response.data?.message || 'Unknown error'));
    }

    // Clean up the temporary file
    try {
      await fs.promises.unlink(filePath);
      console.log('Temporary file cleaned up:', filePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    return response.data.url; // Assuming the API returns the image URL in this format
  } catch (error: any) {
    console.error('Server Upload Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`Failed to upload image to server: ${error.message}`);
  }
}

// 🌐 Fetch all users
async function fetchAllUsers() {
  const response = await axios.get(
    "https://testadmin.mysampark.com/api/bussiness_list"
  );
  return response.data.data;
}
// 🧠 Main runner
async function generateForAllUsers() {
  try {
    const users = await fetchAllUsers();
    console.log(`✅ Fetched ${users.length} users`);

    // Create output dir if not exists
    const outputDir = path.join(__dirname, "output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
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
    console.log("currentTime", currentTime);
    let business;
    for (const user of users) {
      try {
        // console.log("user", user);
        // for (let i = 0; i < user.businesses.length; i++) {
        business = user?.business;

        // ✅ Check if active_business and its ID are valid
        if (!business || !business.id || business.whatsapp_number == null) {
          const businessId = business?.id ?? "unknown";
          const reason = !business
            ? "Missing business object"
            : !business.id
            ? "Missing business ID"
            : business.whatsapp_number == null
            ? "Missing WhatsApp number"
            : "Unknown reason"; // fallback (shouldn't hit)

          console.warn(`⚠️ Skipping business ${businessId}: ${reason}.`);
          continue;
        }

        // Step 2: Fetch custom frame
        const frameResponse = await axios.post(
          "https://testadmin.mysampark.com/api/display_bussiness_frame",
          { business_id: business.id }
        );

        const customFrames = {
          data: frameResponse.data?.data,
          line_content: frameResponse.data?.line_content,
          globalfont: frameResponse.data?.globalfont,
        };

        // ✅ Proceed only if all required frame data exists
        if (
          !Array.isArray(customFrames.data) ||
          customFrames.data.length === 0 ||
          !customFrames.line_content ||
          !Array.isArray(customFrames.globalfont) ||
          customFrames.globalfont.length === 0
        ) {
          console.error(`❌ Missing frame data for user ${business.id}`);
          continue;
        }

        // changes
        // ✅ Check if current time matches scheduled time
        // console.log(
        //   "timing condition",
        //   business.post_schedult_time !== currentTime &&
        //     business.postUserSend !== currentTime
        // );
        // if (
        //   business.post_schedult_time !== currentTime &&
        //   business.postUserSend !== currentTime
        // ) {
        //   console.log(`⏰ Skipping user ${business.id}: Not scheduled for now`);
        //   continue;
        // }
        let captionResponse = await getWhatsappMessageCaption(business.id);
        console.log("captionResponse", captionResponse);
        for (let j = 0; j <= 1; j++) {
          // Step 3: Generate image buffer
          const buffer = await generateImageBuffer(
            user,
            customFrames,
            business,
            j
          );

          // Generate a unique filename using timestamp and IDs
          const timestamp = Date.now();
          const filename = `image_${timestamp}_${business.id}_${j}.png`;
          const outputPath = path.join(outputDir, filename);
          
          // Save the image
          fs.writeFileSync(outputPath, buffer);
          console.log(`🖼️ Image generated and saved: ${outputPath}`);

          // Get the public URL for the image
          const imageUrl = getPublicImageUrl(filename);
          console.log(`📤 Image URL generated: ${imageUrl}`);

          // Send via WhatsApp using the local URL
          let whatsaappAPIresponse = await sendWhatsAppTemplate(
            business.whatsapp_number || "919624863068",
            imageUrl,
            captionResponse
          );

          // console.log(
          //   "Expression Evaluation Result",
          //   backgroundImagePostIdCache.has(`${business.id}-post_id`) && j > 0
          // );
          if (
            backgroundImagePostIdCache.has(`${business.id}-post_id`) &&
            j > 0
          ) {
            if (!whatsaappAPIresponse) {
              await updateUserPostIdOnServer(
                business.user_id,
                backgroundImagePostIdCache.get(`${business.id}-post_id`),
                false,
                business.id,
                getCurrentTimeISTPlus10()
              );
            } else {
              await updateUserPostIdOnServer(
                business.user_id,
                backgroundImagePostIdCache.get(`${business.id}-post_id`),
                true,
                business.id
              );
            }
            console.log(
              "Now Deleting backgroundImagePostIdCache",
              `${business.id}-post_id`
            );
            backgroundImagePostIdCache.delete(`${business.id}-post_id`);
          }
        }
        // }
      } catch (err) {
        console.error(
          `❌ Error generating image for user ${business.id}:`,
          err.message
        );
      }
    }

    // Optional: Clean up old images (keeping last 24 hours)
    cleanupOldImages(outputDir);
  } catch (err) {
    console.error("❌ Error in main process:", err);
  }
}

// Function to clean up old images
function cleanupOldImages(directory: string) {
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds

    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < oneDayAgo) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up old image: ${file}`);
      }
    });
  } catch (error) {
    console.warn('⚠️ Error cleaning up old images:', error);
  }
}

// ⏰ Cron job scheduled for 12:30 AM every day
// "* * * * *"
cron.schedule("22 12 * * *", () => {
  console.log("🚀 Cron job started at", new Date().toLocaleString());
  generateForAllUsers();
});

// Serve static files from the output directory
app.use('/images', express.static(path.join(__dirname, 'output')));

// Function to get server IP addresses
function getServerAddresses(): { internal: string[], external: string[] } {
  const interfaces = os.networkInterfaces();
  const addresses = {
    internal: [],
    external: []
  };

  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName]?.forEach((interface_) => {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface_.family === 'IPv4') {
        if (interface_.internal) {
          addresses.internal.push(interface_.address);
        } else {
          addresses.external.push(interface_.address);
        }
      }
    });
  });

  return addresses;
}

// Function to get public URL for an image with detected IP
function getPublicImageUrl(filename: string): string {
  // Try to get the base URL from environment variable first
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}/images/${filename}`;
  }

  // If no BASE_URL is set, try to use the server's IP
  const addresses = getServerAddresses();
  const serverIP = addresses.external[0] || addresses.internal[0] || 'localhost';
  const serverUrl = `http://${serverIP}:${PORT}`;
  
  console.log('Available Server URLs:');
  console.log('Internal addresses:', addresses.internal.map(ip => `http://${ip}:${PORT}`));
  console.log('External addresses:', addresses.external.map(ip => `http://${ip}:${PORT}`));
  console.log('Using server URL:', serverUrl);
  
  return `${serverUrl}/images/${filename}`;
}

// Start the server with IP information
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const addresses = getServerAddresses();
  console.log('\nServer is running on:');
  console.log('Internal addresses:');
  addresses.internal.forEach(ip => {
    console.log(`  http://${ip}:${PORT}`);
  });
  console.log('\nExternal addresses:');
  addresses.external.forEach(ip => {
    console.log(`  http://${ip}:${PORT}`);
  });
  console.log('\nLocal address:');
  console.log(`  http://localhost:${PORT}`);
});
