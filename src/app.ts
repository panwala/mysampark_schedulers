import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import routes from "./routes";
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
import FormData from "form-data";
import { processUserImage } from "./routes/generateImageRoute";
const https = require("https");
const { createCanvas, loadImage, registerFont } = require("canvas");
const os = require('os');
const path = require("path");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

dotenv.config();
require("./routes/demo");
const PORT = 43007;

// Function to get server IP addresses
function getServerAddresses(): { internal: string[], external: string[] } {
  const interfaces = os.networkInterfaces();
  const addresses = {
    internal: [],
    external: []
  };

  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName]?.forEach((interface_: any) => {
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

// Function to get public IP using external service
async function getPublicIP(): Promise<string | null> {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Failed to fetch public IP:', error.message);
    return null;
  }
}

// Test URL endpoint to verify server is accessible
app.get("/test", (req: Request, res: Response) => {
  res.json({ 
    message: "Server is running",
    clientIP: req.ip,
    headers: req.headers,
    host: req.get('host')
  });
});

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

// Add error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);
  if ((err as any).type === 'entity.too.large') {
    res.status(413).json({ 
      error: 'Payload too large',
      message: 'The uploaded file exceeds the size limit of 8MB'
    });
    return;
  }
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
  return;
};

app.use(errorHandler);

app.listen(PORT, async () => {
  const addresses = getServerAddresses();
  const publicIP = await getPublicIP();
  
  console.log('\n=== SERVER INFORMATION ===');
  console.log('\n1. Local Network URLs:');
  addresses.internal.forEach(ip => {
    console.log(`   • http://${ip}:${PORT}`);
  });
  
  console.log('\n2. Private Network URLs:');
  addresses.external.forEach(ip => {
    console.log(`   • http://${ip}:${PORT}`);
  });
  
  console.log('\n3. Public URL:');
  if (publicIP) {
    console.log(`   • http://${publicIP}:${PORT}`);
  } else {
    console.log('   • Could not determine public IP');
  }
  
  console.log('\n4. Environment URL:');
  if (process.env.BASE_URL) {
    console.log(`   • ${process.env.BASE_URL}`);
  } else {
    console.log('   • Not set (BASE_URL environment variable is missing)');
  }
  
  console.log('\n5. Test URLs:');
  addresses.external.forEach(ip => {
    console.log(`   • http://${ip}:${PORT}/test`);
  });
  if (publicIP) {
    console.log(`   • http://${publicIP}:${PORT}/test`);
  }
  
  console.log('\nTo verify server accessibility:');
  console.log('1. Try opening the test URLs in your browser');
  console.log('2. The working URL is the one you should use as BASE_URL');
  console.log('3. Set it using: export BASE_URL=http://your.working.ip:43007');
  console.log('\n=========================\n');
});
