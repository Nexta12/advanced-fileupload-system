const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const fileSystem = require("fs");
const path = require("path");
const sharp = require("sharp");

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDINARYSECRET,
  secure: true,
});

// Config Option

const options = {
  resource_type: "auto",
  folder: "tutorial",
};

const internetAccess = async () => {
  try {
    await axios.get("https://www.google.com", { timeout: 3000 });

    return true;
  } catch (error) {
    return false;
  }
};

const deletFileFromTmpFolder = (fileName) => {
  fileSystem.unlink(fileName, (err) => {
    if (err) throw err;
  });
};

// Always create a upload folder in the root directory

const uploadDir = path.join(__dirname, "../../uploads");
if (!fileSystem.existsSync(uploadDir)) {
  fileSystem.mkdirSync(uploadDir);
}

const compressFIle = async (uploadedFilePath, updatedFileName) => {
  try {
    await sharp(uploadedFilePath)
      .resize({ fit: sharp.fit.contain, width: 800 })
      .toFormat("webp")
      .webp({ lossless: true, quality: 60, alphaQuality: 80, force: false })
      .toFile(`uploads/${updatedFileName}`);
  } catch (error) {
    console.log(error);
  }
};

// Upload compress and non compressed files to Cloudinary

const uploadToCloudinary = async (compressedFile) => {
  try {
    const result = await cloudinary.uploader.upload(
      `uploads/${compressedFile}`,
      options
    );

    return result;
  } catch (error) {
    console.log(error);
  }
};

const getFIleExtension = (uploadedFiles) => {
  return uploadedFiles.name.split(".").pop().toLowerCase();
};
const getFIleName = (uploadedFiles) => {
  return uploadedFiles.name.replace(/\..+$/, "");
};

const renamedFileName = (fileName, extention) => {
  return `new-${fileName}-${Date.now()}.${extention}`;
};

const saveUnCompressibleFiles = async (updatedFileName, uploadedFile) => {
  try {
    const savePath = path.resolve(`uploads/${updatedFileName}`);
    await uploadedFile.mv(savePath);
  } catch (error) {
    console.log(error);
  }
};

exports.cloudinaryUploader = async (req, res, next) => {
  try {
    //  Check if file is uploaded

    if (req.files) {
      // process files

      req.body.uploads = [];

      const uploadedFiles = req.files.uploads;

      //   Check for internet Acces
      const isOnline = await internetAccess();

      const unCompressibleExtensions = ["pdf", "mp4", "mp3", 'wav', 'avi', 'doc', 'docx'];

      if (!isOnline) {
        // Check how may files are uploaded
        if (Array.isArray(uploadedFiles)) {
          uploadedFiles.forEach((item) => {
            deletFileFromTmpFolder(item.tempFilePath);
          });
          return res.status(403).json({ msg: "No Internet Access" });
        } else {
          deletFileFromTmpFolder(uploadedFiles.tempFilePath);
          return res.status(403).json({ msg: "No Internet Access" });
        }
      }

      if (!Array.isArray(uploadedFiles)) {
        //   Handle single file upload.
        const uploadedFilePath = fileSystem.readFileSync(
          uploadedFiles.tempFilePath
        );

        const extention = getFIleExtension(uploadedFiles);

        //   Get the fileName (original name)
        const fileName = getFIleName(uploadedFiles);

        //  Rename file for Uniqueness
        let updatedFileName = renamedFileName(fileName, extention);
       
          if(uploadedFiles.mimetype.startsWith("image/")){
             await compressFIle(uploadedFilePath, updatedFileName);
          }else{
            // Files to Skipp Compression
            // check if uploaded file is allowed.

            if(!unCompressibleExtensions.includes(extention)){
              throw new Error("File type not allowed")
            }
            saveUnCompressibleFiles(updatedFileName, uploadedFiles);
          }

        // Upload to cloudinary

        const result = await uploadToCloudinary(updatedFileName);


        // Save returned URL of Image to Req.body

        req.body.uploads.push({
          url: result.secure_url,
          public_id: result.public_id.split("/").pop(),
          format: result.format,
          fileSize: result.bytes
        });

        if (!unCompressibleExtensions.includes(extention)){
          //  Delete image files in tmp folder
          deletFileFromTmpFolder(uploadedFiles.tempFilePath);
        }
        // Delete non Image file
        deletFileFromTmpFolder(`uploads/${updatedFileName}`);
      } else {
        //  Multiple files uploaded

        await Promise.all(
          uploadedFiles.map(async (file) => {
            try {
              // Read the uploaded file path

              const uploadedFilePath = fileSystem.readFileSync(
                file.tempFilePath
              );

              // Get the extention of each file
              const extention = getFIleExtension(file);

              // Get the original name of each file
              const fileName = getFIleName(file);

              // set a new unique name for each file

              let updatedFileName = renamedFileName(fileName, extention);


                if (file.mimetype.startsWith("image/")) {
                     // send images to compression
                    await compressFIle(uploadedFilePath, updatedFileName);
                } else {
                  // Files to Skipp Compression
                  // check if uploaded file is allowed.

                  if (!unCompressibleExtensions.includes(extention)) {
                    throw new Error("File type not allowed");
                  }
                  saveUnCompressibleFiles(updatedFileName, file);
                  
                }

              // upload to cloudinary

              const result = await uploadToCloudinary(updatedFileName);

              // Save returned URL of Image to Req.body

                 req.body.uploads.push({
                   url: result.secure_url,
                   public_id: result.public_id.split("/").pop(),
                   format: result.format,
                   fileSize: result.bytes,
                 });

               if (!unCompressibleExtensions.includes(extention)) {
                  //  Deleted from tmp
                 deletFileFromTmpFolder(file.tempFilePath);
               }
               // Delete non Image file
               deletFileFromTmpFolder(`uploads/${updatedFileName}`);


            } catch (error) {
              console.log({error: error.message});
            }
          })
        );
      }
    }

    next();
  } catch (error) {
    console.log({ err: error.message });

    res.status(403).json({err: error.message})
  }
};
