import helmet from 'helmet';

const configureHelmet = () => {
    return helmet ({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "https://www.gravatar.com"],
                connectSrc: ["'self'"],
            },
        },
        hsts: process.env.NODE_ENV === 'production',
    });
};

export default configureHelmet;
