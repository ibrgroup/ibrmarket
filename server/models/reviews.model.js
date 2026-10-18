import mongoose from 'mongoose';

const reviewsSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default: '',
    },
    userName: {
      type: String,
      default: '',
    },
    review: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    userId: {
      type: String,
      default: '',
    },
    productId: {
      type: String,
      default: '',
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    replies: [
      {
        userId: String,
        userName: String,
        reply: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reports: [
      {
        userId: String,
        reason: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

const ReviewModel = mongoose.model('reviews', reviewsSchema);

export default ReviewModel;
