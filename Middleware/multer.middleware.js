import multer from "multer";
import fs from "fs"
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        const uploadPath = path.join(__dirname, 'public');

        // Ensure the folder exists
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null,uploadPath)
    },

    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})
// const storage = multer.memoryStorage()

 const upload=multer({
    storage,
});

export {upload};