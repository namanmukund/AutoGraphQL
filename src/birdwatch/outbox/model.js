import mongoose from 'mongoose';

const { Schema } = mongoose;

const outboxEventSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    operation: {
      type: String,
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'DELIVERED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    lastAttemptAt: {
      type: Date,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastError: {
      type: String,
    },
    deliveredWebhooks: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'outboxEvents',
  },
);

// Prevent overwrite errors in test environments
const OutboxEvent = mongoose.models.OutboxEvent
  || mongoose.model('OutboxEvent', outboxEventSchema);

export default OutboxEvent;
