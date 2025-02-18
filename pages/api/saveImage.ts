import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import os from "os";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { base64data, subDirName, filename } = req.body;

    const homeDir = os.homedir();
    const dirPath = path.join(homeDir, subDirName);
    const filePath = path.join(dirPath, filename);

    // 디렉토리가 존재하지 않으면 생성
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    try {
      //console.log("fs.writeFile: ");
      await fs.promises.writeFile(filePath, base64data, "base64");
      //console.log(":fs.writeFile");
      res.status(200).json({ message: "Image saved successfully!", filePath });
    } catch (err) {
      console.error("Error saving image:", err);
      res.status(500).json({ error: "Error saving image" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
