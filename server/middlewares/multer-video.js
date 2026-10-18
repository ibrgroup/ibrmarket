import multer from 'multer';

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads');
	},
	filename: function (req, file, cb) {
		cb(null, `${Date.now()}_${file.originalname}`);
	},
});

/** Видео товара: до ~50 МБ на файл, до 3 файлов за запрос (см. роут). */
export const uploadVideo = multer({
	storage,
	limits: { fileSize: 52 * 1024 * 1024 },
});
