import mongoose from 'mongoose';

const cspReportSchema = new mongoose.Schema({
    documentUri: String,
    violatedDirective: String,
    blockedUri: String,
    originalPolicy: String,
    disposition: String,
    statusCode: Number,
    sourceFile: String,
    lineNumber: Number,
    columnNumber: Number,
    userAgent: String,
    ip: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000,  // TTL: auto-delete after 30 days
    },
});

cspReportSchema.index({ violatedDirective: 1 });
cspReportSchema.index({ blockedUri: 1 });

export default mongoose.model('CspReport', cspReportSchema);
