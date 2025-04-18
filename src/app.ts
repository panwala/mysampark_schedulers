import express, { Request, Response } from "express";
import dotenv from "dotenv";
import routes from "./routes";
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
import { processUserImage } from "./routes/generateImageRoute";
const https = require("https");
const { createCanvas, loadImage, registerFont } = require("canvas");

/// Define font paths
const app = express();
app.use(express.json({ limit: "4mb" }));
dotenv.config();
require("./routes/demo");
const PORT = 43007;
const path = require("path");

// 🚀 API Endpoint to trigger manually
// Update your /generate-images route like this:
// app.post("/generate-images", async (req: Request, res: Response) => {
//   const { userId, mobile, force = false } = req.body;

//   if (!userId && !mobile) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide either 'userId' or 'mobile' in the request body.",
//     });
//   }

//   try {
//     const users = await fetchAllUsers();
//     let user;

//     if (userId) {
//       user = users.find((u) => u.id === userId);
//     } else if (mobile) {
//       user = users.find((u) => u.mobileno === mobile);
//     }

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found." });
//     }

//     const business = user?.active_business;
//     if (!business?.id) {
//       return res.status(400).json({ success: false, message: "User has no active business." });
//     }

//     const frameResponse = await axios.post(
//       "https://testadmin.mysampark.com/api/display_bussiness_frame",
//       { business_id: business.id }
//     );

//     const customFrames = {
//       data: frameResponse.data?.data,
//       line_content: frameResponse.data?.line_content,
//       globalfont: frameResponse.data?.globalfont,
//     };

//     if (
//       !Array.isArray(customFrames.data) ||
//       customFrames.data.length === 0 ||
//       !customFrames.line_content ||
//       !Array.isArray(customFrames.globalfont) ||
//       customFrames.globalfont.length === 0
//     ) {
//       return res.status(400).json({ success: false, message: "Incomplete frame data." });
//     }

//     // Time check unless forced
//     function getCurrentTimeIST() {
//       return new Intl.DateTimeFormat("en-GB", {
//         hour12: false,
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//         timeZone: "Asia/Kolkata",
//       }).format(new Date());
//     }

//     const currentTime = getCurrentTimeIST();
//     if (!force && business.post_schedult_time !== currentTime) {
//       return res.status(400).json({
//         success: false,
//         message: `Scheduled time mismatch: now=${currentTime}, scheduled=${business.post_schedult_time}`,
//       });
//     }

//     const buffer = await generateImageBuffer(user, customFrames);
//     const outputDir = path.join(__dirname, "output");
//     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

//     const filename = `${Math.random()}user-${user.id}.png`;
//     const outputPath = path.join(outputDir, filename);
//     fs.writeFileSync(outputPath, buffer);
//     console.log(`🖼️ Image generated for user ${user.id}`);

//     const uploadResponse = await uploadImageToAPI(
//       outputPath,
//       "https://cloudapi.wbbox.in",
//       "918849987778",
//       "OQW891APcEuT47TnB4ml0w"
//     );

//     await sendWhatsAppTemplate(
//       user.mobileno || "919624863068",
//       uploadResponse.data.ImageUrl
//     );

//     res.status(200).json({ success: true, imageUrl: uploadResponse.data.ImageUrl });
//   } catch (err) {
//     console.error("❌ Error:", err.message);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });
app.get("/", (req: Request, res: Response) => {
  res.send("Run");
});
app.get("/generate-image", async(req: Request, res: Response) => {
  console.log("req.body",req.body)
  await processUserImage(req.body.userId)
  res.send("Done");
});
app.use("/api/v1", ...routes);

app.listen(PORT, () => {
  console.log("LISTION on " + PORT);
});
