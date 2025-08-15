
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");


// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, JPG, PNG, WebP, MP4, MPEG & MOV are allowed."
      ),
      false
    );
  }
};

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter,
});

const uploadToS3 = async (file, folder = "") => {
  try {
    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const upload = new Upload({
      client: s3,
      params: uploadParams,
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(`Upload Progress: ${progress.loaded}/${progress.total}`);
    });

    const result = await upload.done();
    return result.Location;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file to S3");
  }
};

const handleFileUpload = (fieldName, folder) => (req, res, next) => {
  multerUpload.single(fieldName)(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        let errorMessage = "File upload error.";
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            errorMessage = "File is too large. Max size is 100MB.";
            break;
          case "LIMIT_UNEXPECTED_FILE":
            errorMessage = "Unexpected file field.";
            break;
          default:
            errorMessage = "File upload failed.";
        }
        return res.status(400).json({ success: false, message: errorMessage });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    try {
      const fileUrl = await uploadToS3(req.file, folder);
      req.fileUrl = fileUrl;
      next();
    } catch (error) {
      console.error("Upload Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file. Please try again.",
      });
    }
  });
};

module.exports = {
  handleFileUpload,
};
