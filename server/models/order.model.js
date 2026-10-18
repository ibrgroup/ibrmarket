import mongoose from 'mongoose';

const ORDER_STATUS_ENUM = ['WAITING_PAYMENT', 'PAID', 'CANCELLED', 'DELIVERED', 'REFUSED'];
const PAYMENT_TYPE_ENUM = ['YOOKASSA', 'ON_DELIVERY'];
const DELIVERY_METHOD_ENUM = ['courier', 'pickup'];

const orderSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
		},
		products: [
			{
				productId: { type: String },
				productTitle: { type: String },
				quantity: { type: Number },
				price: { type: Number },
				image: { type: String },
				subTotal: { type: Number },
				brand: { type: String },
				size: { type: String },
				color: { type: String },
				ram: { type: String },
				weight: { type: String },
				discount: { type: Number },
				/** Сколько единиц возвращено/отменено по этой позиции */
				returnedQuantity: { type: Number, default: 0 },
				/** RETURNED | REFUSED | CANCELLED — последняя причина по позиции */
				returnReason: { type: String, default: '' },
				/** Накопленная сумма возврата по позиции */
				refundAmount: { type: Number, default: 0 },
			},
		],
		paymentId: {
			type: String,
			default: '',
		},
		/** YOOKASSA — онлайн; ON_DELIVERY — оплата при получении (без ЮKassa) */
		payment_type: {
			type: String,
			enum: PAYMENT_TYPE_ENUM,
			default: 'YOOKASSA',
		},
		order_status: {
			type: String,
			enum: ORDER_STATUS_ENUM,
			default: 'WAITING_PAYMENT',
		},
		delivery_address: {
			type: mongoose.Schema.ObjectId,
			ref: 'address',
		},
		/** Курьер или самовывоз (как на checkout) */
		delivery_method: {
			type: String,
			enum: DELIVERY_METHOD_ENUM,
			default: 'courier',
		},
		totalAmount: {
			type: Number,
			default: 0,
		},
		/** Сумма возвратов по заказу (частичные возвраты позиций) */
		refundedAmount: {
			type: Number,
			default: 0,
		},
		reservedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

orderSchema.index({ paymentId: 1 });

orderSchema.virtual('total').get(function () {
	return this.totalAmount;
});
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const OrderModel = mongoose.model('order', orderSchema);

export default OrderModel;
