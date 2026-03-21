import CspReport from '../models/CspReport.js';
import { logger } from '../middleware/requestLogger.js';

export async function receiveReport(req, res) {
    try {
        const report = req.body?.['csp-report'];
        if (!report) {
            return res.status(400).end();
        }

        const entry = await CspReport.create({
            documentUri: report['document-uri'],
            violatedDirective: report['violated-directive'],
            blockedUri: report['blocked-uri'],
            originalPolicy: report['original-policy'],
            disposition: report['disposition'],
            statusCode: report['status-code'],
            sourceFile: report['source-file'],
            lineNumber: report['line-number'],
            columnNumber: report['column-number'],
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        });

        logger.warn({
            type: 'csp-violation',
            directive: entry.violatedDirective,
            blocked: entry.blockedUri,
            page: entry.documentUri,
        }, 'CSP violation reported');

        res.status(204).end();
    } catch (err) {
        logger.error(err, 'Failed to save CSP report');
        res.status(500).end();
    }
}

export async function listReports(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.directive) {
        filter.violatedDirective = { $regex: req.query.directive, $options: 'i' };
    }
    if (req.query.blocked) {
        filter.blockedUri = { $regex: req.query.blocked, $options: 'i' };
    }

    const [reports, total] = await Promise.all([
        CspReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        CspReport.countDocuments(filter),
    ]);

    res.json({
        status: 'success',
        data: {
            reports,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
    });
}
