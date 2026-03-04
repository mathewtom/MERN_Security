const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return false;

    let sanitized = false;

    for (const key of Object.keys(obj)) {

        //Remove any objects with "$" operator or "." notation
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
            sanitized = true;
        } else if (typeof obj[key] === 'object') {
            //Recursively sanitize nested objects
            if (sanitizeObject(obj[key])) {
                sanitized = true;
            }

        }

    }

    return sanitized;

};

//Exported mongoSanitize
const mongoSanitize = (req, _res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    next();
};

export default mongoSanitize;