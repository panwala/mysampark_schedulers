// filename: cronImageGenerator.js

const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
const path = require("path");
const https = require("https");
import { Image } from "canvas";
const { createCanvas, loadImage, registerFont } = require("canvas");

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

async function getBackgroundImageUrl(bussiness_id: Number): Promise<any> {
  try {
    console.log("bussiness_id", bussiness_id);
    const res = await axios.post(
      "https://testadmin.mysampark.com/api/imageapi",
      { bussiness_id: bussiness_id }
    );
    return (
      res.data || {
        story:
          "https://testadmin.mysampark.com/images/15/story/67da6410d8d52_3.png",
        post: "https://testadmin.mysampark.com/images/15/post/67da637ea1787_3.png",
        caption:
          "Success is a mindset, not a destination.  Transform your attitude, transform your results. #TechSolutions #SuccessMindset ",
      }
    );
    res.data || null;
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
    console.log("ress", res.data.data);
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
// Function to send WhatsApp message
const sendWhatsAppTemplate = async (
  phoneNumber: any,
  imageUrl: string,
  caption: any
) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer OQW891APcEuT47TnB4ml0w",
  };
  console.log("imageUrl", imageUrl);
  console.log("caption", caption);
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
    type: "template",
    template: {
      name: "image_delivery_update",
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
              text: caption.caption,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: caption.caption,
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

    const result = await response.text();
    console.log(`📤 WhatsApp response: ${result}`);
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error);
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
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      `${apiDomainUrl}/api/v1.0/uploads/${channelNumber}`,
      form,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders(), // ✅ works with correct FormData
        },
      }
    );

    // console.log(`✅ Upload successful:`, response.data);
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
    "https://testadmin.mysampark.com/api/all_user_list"
  );
  // console.log("response", response.data.data);
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

    const currentTime = getCurrentTimeIST();
    console.log("currentTime", currentTime);
    for (const user of users) {
      try {
        for (let i = 0; i < user.businesses.length; i++) {
          const business = user?.businesses[i];

          // ✅ Check if active_business and its ID are valid
          if (!business?.id) {
            console.warn(
              `⚠️ Skipping user ${user.id}: No active business or business ID.`
            );
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
            console.error(`❌ Missing frame data for user ${user.id}`);
            continue;
          }

          // changes
          // ✅ Check if current time matches scheduled time
          if (business.post_schedult_time !== currentTime) {
            console.log(`⏰ Skipping user ${user.id}: Not scheduled for now`);
            continue;
          }
          let captionResponse = await getWhatsappMessageCaption(business.id);
          for (let j = 0; j <= 1; j++) {
            // Step 3: Generate image buffer
            const buffer = await generateImageBuffer(
              user,
              customFrames,
              business,
              j
            );

            // Step 4: Save image
            const filename = `${Math.random()}user-${user.id}.png`;
            const outputPath = path.join(outputDir, filename);
            fs.writeFileSync(outputPath, buffer);
            console.log(
              `🖼️ Image generated for user ${user.id}: ${outputPath}`
            );

            // Step 5: Upload image
            const uploadResponse = await uploadImageToAPI(
              outputPath,
              "https://cloudapi.wbbox.in",
              "918849987778",
              "OQW891APcEuT47TnB4ml0w"
            );

            // console.log("uploadResponse", uploadResponse);

            // Step 6: Send via WhatsApp
            // changes
            await sendWhatsAppTemplate(
              // "919624863068",
              user.mobileno || "919624863068",
              uploadResponse.data.ImageUrl,
              captionResponse
            );
          }
        }
      } catch (err) {
        console.error(
          `❌ Error generating image for user ${user.id}:`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error("Status:", err.response?.status);
    console.error("Headers:", err.response?.headers);
    console.error("Data:", err.response?.data);
  }
}

// ⏰ Cron job scheduled for 12:30 AM every day
cron.schedule("* * * * *", () => {
  console.log("🚀 Cron job started at", new Date().toLocaleString());
  generateForAllUsers();
});
