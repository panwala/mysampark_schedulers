const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
const path = require("path");
const https = require("https");
const { createCanvas, loadImage, registerFont } = require("canvas");
// Register Montserrat fonts
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
// Helper: fetch background image URL
async function getBackgroundImageUrl(): Promise<string> {
  const res = await axios.get("https://admin.mysampark.com//api/imageapi");
  return res.data?.data;
}

// Helper: generate image buffer for a user
async function generateImageBuffer(user: any, framesData: any): Promise<Buffer> {
  // load background
  const bgUrl = await getBackgroundImageUrl();
  const bgImage = await loadImage(bgUrl);
  
  // Create canvas with optimized dimensions
  const maxWidth = 1200; // Maximum width to maintain quality while reducing size
  const aspectRatio = bgImage.height / bgImage.width;
  const width = Math.min(bgImage.width, maxWidth);
  const height = Math.round(width * aspectRatio);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  // Draw background with smooth scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bgImage, 0, 0, width, height);

  // load frame overlay
  const frame = framesData.data[0];
  const variant = frame.frames_varinat[0];
  const overlay = await loadImage(variant.image_url);
  
  // Scale overlay proportionally
  const overlayScale = width / bgImage.width;
  const overlayHeight = overlay.height * overlayScale;
  ctx.drawImage(overlay, 0, height - overlayHeight, width, overlayHeight);

  // prepare text lines, icons, fonts, colors
  const { line_content, globalfont } = framesData;
  const icons = {
    email: await loadImage(frame.frame_icon.email_icon),
    mobile1: await loadImage(frame.frame_icon.mobile_no_1_icon),
    mobile2: await loadImage(frame.frame_icon.mobile_no_2_icon),
    instagram: await loadImage(frame.frame_icon.instragram_icon),
    location: await loadImage(frame.frame_icon.location_icon),
    website: await loadImage(frame.frame_icon.website_icon),
  };

  // Scale text and icons based on canvas size
  const scaleFactor = width / bgImage.width;
  const businessFields = [
    user.active_business.business_name,
    user.active_business.mobile_no,
    user.active_business.mobile_no_2,
    user.active_business.instragram_id,
    user.active_business.email,
    user.active_business.address,
    user.active_business.website,
  ];
  const lineKeys = ["line1","line2","line3","line4","line5"];
  const textColors = [frame.frames_text_colour.line1,frame.frames_text_colour.line2,frame.frames_text_colour.line3,frame.frames_text_colour.line4,frame.frames_text_colour.line5];

  // draw each text line with icons
  variant.framesvariantline.forEach((lineDef: any, idx: number) => {
    const contentKey = lineKeys[idx];
    const content = line_content[contentKey];
    if (!content) return;
    const fields = content.split(",").map((i: string) => businessFields[+i - 1] || "");

    // basic font settings
    const fontDef = globalfont.find((f: any) => f.type === contentKey.replace('line','name')) || globalfont[0];
    ctx.font = `${fontDef.font_weight || "normal"} ${fontDef.font_size}px ${frame.font_type}`;
    ctx.fillStyle = textColors[idx] === "Y" ? frame.y : frame.x;

    // position and draw
    let x = +lineDef.x + 10;
    const y = canvas.height - overlay.height + +lineDef.y + +lineDef.height/2;
    fields.forEach((text: string, i: number) => {
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width + 20;
    });
  });

  // Return optimized PNG buffer
  return canvas.toBuffer('image/png', {
    compressionLevel: 8,
    filters: canvas.PNG_FILTER_NONE,
    resolution: 72
  });
}

// Helper: upload image to API
async function uploadImageToAPI(filePath: string): Promise<string> {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  const res = await axios.post(
    "https://cloudapi.wbbox.in/api/v1.0/uploads/918849987778",
    form,
    { headers: { Authorization: `Bearer OQW891APcEuT47TnB4ml0w`, ...form.getHeaders() } }
  );
  return res.data.data.ImageUrl;
}

// Helper: send WhatsApp template
async function sendWhatsApp(phone: string, imageUrl: string): Promise<void> {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: "image_delivery_update",
      language: { code: "en" },
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: imageUrl } }] },
        { type: "body", parameters: [{ type: "text", text: "Banner Image" }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "http://www.mysampark.com/" }] }
      ]
    }
  };
  await axios.post(
    "https://cloudapi.wbbox.in/api/v1.0/messages/send-template/918849987778",
    payload,
    { headers: { "Content-Type": "application/json", Authorization: `Bearer OQW891APcEuT47TnB4ml0w` } }
  );
}

// Core function: process image for specific user ID
export async function processUserImage(userId: number | string) {
  // fetch all users
  const usersRes = await axios.get("https://admin.mysampark.com//api/all_user_list");
  console.log("usersRes",usersRes)
  const user = usersRes.data.data.find((u: any) => u.id == userId);
  console.log("user",user)
  if (!user) throw new Error(`User with id=${userId} not found`);
  if (!user.businesses[0]?.id) throw new Error(`User ${userId} has no active business`);

  // fetch frame data
  const frameRes = await axios.post(
    "https://admin.mysampark.com//api/display_bussiness_frame",
    { business_id: user.businesses[0].id }
  );
  const framesData = {
    data: frameRes.data.data,
    line_content: frameRes.data.line_content,
    globalfont: frameRes.data.globalfont,
  };

  // generate image
  const buffer = await generateImageBuffer(user, framesData);

  // save locally
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  const filename = `user_${userId}_${Date.now()}.png`;
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, buffer);

  // upload & send
  const imageUrl = await uploadImageToAPI(outputPath);
  await sendWhatsApp("919624863068",imageUrl)
//   await sendWhatsApp(user.mobileno || user.active_business.mobile_no || "919624863068", imageUrl);

  return imageUrl;
}
