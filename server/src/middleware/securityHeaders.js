import helmet from 'helmet';


//Configure a custom Content-Security-Policy and enforce HSTS
const configureHelmet = () => {
    return helmet ({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                imgSrc: ["'self"],
            },
        },
        hsts: process.env.NODE_ENV === 'production',

    });
};

export default configureHelmet;
