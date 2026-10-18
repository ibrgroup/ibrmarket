import { z } from 'zod';

/** MongoDB ObjectId как строка (24 hex) или пусто / null для сброса опциональных ref */
const objectIdRef = z
	.union([z.string().regex(/^[a-fA-F0-9]{24}$/), z.literal(''), z.null()])
	.optional();

const variantStockEntrySchema = z.object({
	size: z.union([z.string(), z.null()]).optional(),
	color: z.union([z.string(), z.null()]).optional(),
	weight: z.union([z.string(), z.null()]).optional(),
	ram: z.union([z.string(), z.null()]).optional(),
	count: z.coerce.number().int().nonnegative(),
});

export const orderStatusPatchSchema = z.object({
	order_status: z.enum(['WAITING_PAYMENT', 'PAID', 'CANCELLED', 'DELIVERED', 'REFUSED']),
});

export const orderItemReturnSchema = z.object({
	quantity: z.coerce.number().int().positive('quantity must be at least 1'),
	reason: z.enum(['RETURNED', 'REFUSED', 'CANCELLED']),
	note: z.string().max(500).optional(),
});

export const categoryCreateSchema = z
	.object({
		name: z.string().trim().min(1, 'name is required').max(300),
		images: z.array(z.string().min(1).max(2000)).max(50).optional(),
		parentId: objectIdRef,
		parentCatName: z.string().max(200).optional(),
	})
	.passthrough();

export const categoryUpdateSchema = z
	.object({
		name: z.string().trim().min(1).max(300).optional(),
		images: z.array(z.string().min(1).max(2000)).max(50).optional(),
		parentId: objectIdRef,
		parentCatName: z.string().max(200).optional(),
	})
	.passthrough();

export const productCreateSchema = z
	.object({
		name: z.string().trim().min(1, 'name is required').max(500),
		description: z.string().max(50000).optional().default(' '),
		brand: z.string().max(200).optional().default(''),
		price: z.coerce.number().finite().nonnegative(),
		oldPrice: z.coerce.number().finite().nonnegative().optional().default(0),
		countInStock: z.coerce.number().int().nonnegative(),
		discount: z.coerce.number().finite().nonnegative().optional().default(0),
		rating: z.coerce.number().finite().nonnegative().optional().default(0),
		isFeatured: z.coerce.boolean().optional().default(false),
		isDisplayOnHomeBanner: z.coerce.boolean().optional(),
		bannerTitleName: z.string().max(500).optional(),
		category: objectIdRef,
		catId: z.string().max(100).optional().default(''),
		catName: z.string().max(300).optional().default(''),
		subCatId: z.string().max(100).optional().default(''),
		subCat: z.string().max(300).optional().default(''),
		thirdsubCat: z.string().max(300).optional().default(''),
		thirdsubCatId: z.string().max(100).optional().default(''),
		images: z.array(z.string().min(1).max(2000)).max(30).optional(),
		bannerimages: z.array(z.string().min(1).max(2000)).max(30).optional(),
		productRam: z.array(z.union([z.string(), z.null()])).optional(),
		size: z.array(z.union([z.string(), z.null()])).optional(),
		colors: z.array(z.union([z.string(), z.null()])).optional(),
		productWeight: z.array(z.union([z.string(), z.null()])).optional(),
		variantStock: z.array(variantStockEntrySchema).max(2000).optional(),
	})
	.passthrough();

export const productUpdateSchema = z
	.object({
		name: z.string().trim().min(1).max(500).optional(),
		description: z.string().max(50000).optional(),
		brand: z.string().max(200).optional(),
		price: z.coerce.number().finite().nonnegative().optional(),
		oldPrice: z.coerce.number().finite().nonnegative().optional(),
		countInStock: z.coerce.number().int().nonnegative().optional(),
		discount: z.coerce.number().finite().nonnegative().optional(),
		rating: z.coerce.number().finite().nonnegative().optional(),
		isFeatured: z.coerce.boolean().optional(),
		isDisplayOnHomeBanner: z.coerce.boolean().optional(),
		bannerTitleName: z.string().max(500).optional(),
		category: objectIdRef,
		catId: z.string().max(100).optional(),
		catName: z.string().max(300).optional(),
		subCatId: z.string().max(100).optional(),
		subCat: z.string().max(300).optional(),
		thirdsubCat: z.string().max(300).optional(),
		thirdsubCatId: z.string().max(100).optional(),
		images: z.array(z.string().min(1).max(2000)).max(30).optional(),
		bannerimages: z.array(z.string().min(1).max(2000)).max(30).optional(),
		productRam: z.array(z.union([z.string(), z.null()])).optional(),
		size: z.array(z.union([z.string(), z.null()])).optional(),
		colors: z.array(z.union([z.string(), z.null()])).optional(),
		productWeight: z.array(z.union([z.string(), z.null()])).optional(),
		variantStock: z.array(variantStockEntrySchema).max(2000).optional(),
	})
	.passthrough();

export const chatMessageTextSchema = z.object({
	text: z.string().trim().min(1, 'Пустое сообщение').max(4000),
});

export const chatMessageBodySchema = z
	.object({
		text: z.string().trim().max(4000).optional().default(''),
		attachments: z
			.array(
				z.object({
					url: z
						.string()
						.url('Некорректный URL вложения')
						.refine(
							(u) => {
								try {
									const parsed = new URL(u);
									return (
										parsed.protocol === 'https:' &&
										(parsed.hostname === 'res.cloudinary.com' ||
											parsed.hostname.endsWith('.cloudinary.com'))
									);
								} catch {
									return false;
								}
							},
							{ message: 'Вложение должно быть загружено через чат (Cloudinary)' },
						),
					name: z.string().max(200).optional().default(''),
					mimeType: z.string().max(100).optional().default(''),
				}),
			)
			.max(5)
			.optional()
			.default([]),
	})
	.superRefine((data, ctx) => {
		const text = (data.text || '').trim();
		const attachments = data.attachments || [];
		if (!text && attachments.length === 0) {
			ctx.addIssue({
				code: 'custom',
				message: 'Нужен текст или хотя бы одно вложение',
				path: ['text'],
			});
		}
	});

export const peerConversationSchema = z.object({
	peerUserId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Некорректный peerUserId'),
});

export const supportStatusPatchSchema = z.object({
	status: z.enum(['open', 'closed']),
});
