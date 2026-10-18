import axios from 'axios';
import sharp from 'sharp';

const IMAGE_FETCH_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Difference hash (dHash) — 64-bit perceptual fingerprint.
 * Хорошо находит похожие/одинаковые фото, но не понимает «кроссовки vs кроссовки другого ракурса» как CLIP.
 */
export async function computeDHashFromBuffer(buffer) {
	const { data } = await sharp(buffer)
		.rotate()
		.grayscale()
		.resize(9, 8, { fit: 'fill' })
		.raw()
		.toBuffer({ resolveWithObject: true });

	let hash = '';
	for (let y = 0; y < 8; y += 1) {
		for (let x = 0; x < 8; x += 1) {
			const left = data[y * 9 + x];
			const right = data[y * 9 + x + 1];
			hash += left < right ? '1' : '0';
		}
	}
	return hash;
}

export async function computeDHashFromUrl(url) {
	const response = await axios.get(url, {
		responseType: 'arraybuffer',
		timeout: IMAGE_FETCH_TIMEOUT_MS,
		maxContentLength: MAX_IMAGE_BYTES,
		maxBodyLength: MAX_IMAGE_BYTES,
	});

	return computeDHashFromBuffer(Buffer.from(response.data));
}

export function hammingDistance(hashA, hashB) {
	if (!hashA || !hashB || hashA.length !== hashB.length) {
		return Number.MAX_SAFE_INTEGER;
	}

	let distance = 0;
	for (let i = 0; i < hashA.length; i += 1) {
		if (hashA[i] !== hashB[i]) {
			distance += 1;
		}
	}
	return distance;
}
