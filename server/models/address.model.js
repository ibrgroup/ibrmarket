import mongoose from 'mongoose';

const addressSchema = mongoose.Schema(
  {
    address_line1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{5,6}$/.test(v);
        },
        message: 'Pincode must be 5-6 digits',
      },
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          // Accept both string and number, normalize to string for validation
          const normalized = String(v).replace(/\D/g, '');
          return /^7\d{10}$/.test(normalized);
        },
        message: 'Mobile must be a valid Russian phone number (7XXXXXXXXXX)',
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [200, 'Landmark cannot exceed 200 characters'],
    },
    addressType: {
      type: String,
      enum: ['Home', 'Office'],
      default: 'Home',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
addressSchema.index({ userId: 1 }); // For fast queries by user
addressSchema.index({ userId: 1, createdAt: -1 }); // For sorted queries by user
addressSchema.index({ userId: 1, selected: 1 }); // For finding selected address

const AddressModel = mongoose.model('address', addressSchema);

export default AddressModel;
