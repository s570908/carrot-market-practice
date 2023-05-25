import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import path from "path";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import fs from "fs/promises";
import mime from "mime";

// we are exporting a config object, with the api.bodyParser: false, because Next.js has a default body-parser for parsing form data,
// we have to disable it to be able to parse it ourselves.
export const config = {
  api: {
    bodyParser: false,
  },
};

const FormidableError = formidable.errors.FormidableError;

const readFile = (
  req: NextApiRequest,
  saveLocally?: boolean
): Promise<{ fields: formidable.Fields; files: formidable.Files; filename: string }> => {
  let options: formidable.Options = {};
  let saveLocalOptions: formidable.Options = {};
  let filename: string;
  if (saveLocally) {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    // const customOptions = { uploadDir: uploadDir , keepExtensions: true, allowEmptyFiles: false, maxFileSize: 5 * 1024 * 1024 * 1024, multiples: true ,filter: filterFunction };
    saveLocalOptions = {
      uploadDir: uploadDir,
      keepExtensions: true,
      allowEmptyFiles: false,
      multiples: true,
      //filter: filterFunction,
      filename: (_name, _ext, part) => {
        // console.log("_name: ", _name);
        // console.log("_ext: ", _ext);
        // console.log("part: ", part);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        filename = `${part.originalFilename || "unknown"}-${uniqueSuffix}.${
          mime.getExtension(part.mimetype || "") || "unknown"
        }`;
        return filename;
      },
    };
  }
  const baseOptions = { maxFileSize: 4000 * 1024 * 1024 };
  options = { ...baseOptions, ...saveLocalOptions };
  const form = formidable(options);
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files, filename });
    });
  });
};

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  try {
    await fs.readdir(path.join(process.cwd(), "public", "uploads"));
  } catch (error) {
    await fs.mkdir(path.join(process.cwd(), "public", "uploads"));
  }
  const { fields, files, filename } = await readFile(req, true);
  console.log("file-uploads { fields, files }: ", { fields, files });
  console.log("file-uploads filename: ", filename);

  res.json({
    ok: true,
    data: {
      url: `/uploads/${filename}`,
      //url: "test",
    },
  });
};

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
