import express, { Request, Response } from "express";
import dotenv from "dotenv";
import routes from "./routes";

const app = express();
dotenv.config();
require("./routes/demo");
const PORT = process.env.PORT;
const path = require("path");
const outputPath = path.join(__dirname, "output");
app.use("/output", express.static(path.join(__dirname, "output")));
console.log("Serving static images from:", outputPath);
app.get("/", (req: Request, res: Response) => {
  res.send("Run");
});

app.use("/api/v1", ...routes);

app.listen(PORT, () => {
  console.log("LISTION on " + PORT);
});
