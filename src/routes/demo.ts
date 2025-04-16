// filename: cronImageGenerator.js

const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
const path = require("path");
const https = require("https");
const { createCanvas, loadImage, registerFont } = require("canvas");

/// Define font paths
const fontPath = "./public/font";

registerFont(`${fontPath}/montserrat/Montserrat-Regular.ttf`, {
  family: "Montserrat",
  weight: "normal",
});
registerFont(`${fontPath}/montserrat/Montserrat-Bold.ttf`, {
  family: "Montserrat",
  weight: "bold",
});
registerFont(`${fontPath}/montserrat/Montserrat-Medium.ttf`, {
  family: "Montserrat",
  weight: "500",
});
registerFont(`${fontPath}/montserrat/Montserrat-Light.ttf`, {
  family: "Montserrat",
  weight: "300",
});
registerFont(`${fontPath}/montserrat/Montserrat-Thin.ttf`, {
  family: "Montserrat",
  weight: "100",
});
registerFont(`${fontPath}/montserrat/Montserrat-ExtraBold.ttf`, {
  family: "Montserrat",
  weight: "800",
});
registerFont(`${fontPath}/montserrat/Montserrat-SemiBold.ttf`, {
  family: "Montserrat",
  weight: "600",
});
registerFont(`${fontPath}/montserrat/Montserrat-Black.ttf`, {
  family: "Montserrat",
  weight: "900",
});

async function getBackgroundImageUrl(): Promise<string | null> {
  try {
    const res = await axios.get("https://testadmin.mysampark.com/api/imageapi");
    return res.data?.data || null;
  } catch (error) {
    console.error("Error fetching background image:", error);
    return null;
  }
}
// Function to send WhatsApp message
const sendWhatsAppTemplate = async (phoneNumber: any, imageUrl: string) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer OQW891APcEuT47TnB4ml0w",
  };
  console.log("imageUrl", imageUrl);
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
              text: "Banner Image",
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
              text: "http://www.mysampark.com/",
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

// 🎨 Image rendering logic (reusable)
const generateImageBuffer = async (
  singleuserData: any,
  actualframesData: {
    data: any; // array of frames
    line_content: any; // corrected path
    globalfont: any;
  }
) => {
  try {
    const framesData = actualframesData;
    const userData = singleuserData;

    const lineContent = framesData.line_content;
    const globalFont = framesData.globalfont;
    const frameData = framesData.data[0];
    const framesTextColour = frameData.frames_text_colour;
    const framesVariantData = frameData.frames_varinat[0];
    const framesVariantLines = framesVariantData.framesvariantline;
    const fontFamily = frameData.font_type;

    const businessData = [
      userData.active_business.business_name,
      userData.active_business.mobile_no,
      userData.active_business.mobile_no_2,
      userData.active_business.instragram_id,
      userData.active_business.email,
      userData.active_business.address,
      userData.active_business.website,
    ];

    const backgroundImageUrl = await getBackgroundImageUrl();
    const backgroundImage = await loadImage(backgroundImageUrl);

    const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(backgroundImage, 0, 0);

    const frameOverlayImage = await loadImage(framesVariantData.image_url);
    ctx.drawImage(
      frameOverlayImage,
      0,
      canvas.height - frameOverlayImage.height
    );

    let bottomTextContentHeight = canvas.height - frameOverlayImage.height;
    // 🔧 Calculate overlay height once
    const bottomOverlayHeight = frameOverlayImage.height;

    const icons = {
      email: await loadImage(frameData.frame_icon.email_icon),
      mobile1: await loadImage(frameData.frame_icon.mobile_no_1_icon),
      mobile2: await loadImage(frameData.frame_icon.mobile_no_2_icon),
      location: await loadImage(frameData.frame_icon.location_icon),
      website: await loadImage(frameData.frame_icon.website_icon),
      instagram: await loadImage(frameData.frame_icon.instragram_icon),
    };

    const fontsData = [
      globalFont.find((f: { type: string }) => f.type === "name"),
      globalFont.find((f: { type: string }) => f.type === "mobile_no_1"),
      globalFont.find((f: { type: string }) => f.type === "mobile_no_2"),
      globalFont.find((f: { type: string }) => f.type === "instagram"),
      globalFont.find((f: { type: string }) => f.type === "email"),
      globalFont.find((f: { type: string }) => f.type === "address"),
      globalFont.find((f: { type: string }) => f.type === "website"),
    ].filter((f) => f !== undefined);

    const textColours = [
      framesTextColour.line1,
      framesTextColour.line2,
      framesTextColour.line3,
      framesTextColour.line4,
      framesTextColour.line5,
    ].filter((f) => f !== null);

    const groupOfLines = [
      lineContent.line1,
      lineContent.line2,
      lineContent.line3,
      lineContent.line4,
      lineContent.line5,
    ].filter((f) => f !== null);

    framesVariantLines.forEach(
      (
        row: {
          width: string | number;
          x: string | number;
          y: string | number;
          height: string | number;
        },
        index: number
      ) => {
        let fontSize = +fontsData[0]?.font_size || 12;
        const fontWeight = "normal";
        const iconSize = fontSize * 2;

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColours[index] === "Y" ? frameData.y : frameData.x;

        const linesOfCurrentRow = groupOfLines[index].split(",");

        const texts = linesOfCurrentRow
          .map((line: string | number) => {
            const lineText = businessData[+line - 1];
            return { lineNo: +line, text: lineText || "" };
          })
          .filter((f: null) => f !== null);

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

        // Render text and icons
        texts.forEach((text: { lineNo: number; text: any }) => {
          const getFontSize = fontsData[text.lineNo - 1];
          const fontWeight = +getFontSize.font_weight || "normal";
          ctx.font = `${fontWeight} ${+getFontSize.font_size}px ${fontFamily}`;
          fontSize = +getFontSize.font_size;

          let icon: null;
          switch (text.lineNo) {
            case 2:
              icon = icons.mobile1;
              break;
            case 3:
              icon = icons.mobile2;
              break;
            case 4:
              icon = icons.instagram;
              break;
            case 5:
              icon = icons.email;
              break;
            case 6:
              icon = icons.location;
              break;
            case 7:
              icon = icons.website;
              break;
            default:
              icon = null;
          }

          // Calculate text position
          const yPos =
            +row.y + +row.height / 2 + fontSize / 3 + bottomTextContentHeight;
          const textWidth = ctx.measureText(text.text).width;

          if (icon) {
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
            ctx.fillText(text.text, +xPos, +yPos);
            xPos += textWidth + spacing;
          }
        });
      }
    );

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

    console.log(`✅ Upload successful:`, response.data);
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
        const business = user?.active_business;

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

        // ✅ Check if current time matches scheduled time
        if (business.post_schedult_time !== currentTime) {
          console.log(`⏰ Skipping user ${user.id}: Not scheduled for now`);
          continue;
        }

        // Step 3: Generate image buffer
        const buffer = await generateImageBuffer(user, customFrames);

        // Step 4: Save image
        const filename = `${Math.random()}user-${user.id}.png`;
        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, buffer);
        console.log(`🖼️ Image generated for user ${user.id}: ${outputPath}`);

        // Step 5: Upload image
        const uploadResponse = await uploadImageToAPI(
          outputPath,
          "https://cloudapi.wbbox.in",
          "918849987778",
          "OQW891APcEuT47TnB4ml0w"
        );

        console.log("uploadResponse", uploadResponse);

        // Step 6: Send via WhatsApp
        await sendWhatsAppTemplate(
          business.mobile_no || "919624863068",
          uploadResponse.data.ImageUrl
        );
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
