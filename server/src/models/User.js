
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const VALID_ROLES = ['user', 'admin'];

//Refresh Token Schema

const refreshTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    }.
        { _id: false};
);

//User Schema

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email Required'],
            unique: true, //MongoDB forces unique email
            lowertrue: true, //sends all email to lowercase (prevents case differences)
            trim: true, //removes whitespaces
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
             ],
        },
        password: {
            type: String,
            required: [true, 'Password Required'],
            minlength: [MIN_PASSWORD_LENGTH, 'Password must be at least ${MIN_PASSWORD_LENGTH} characters'],
            maxlength: [MAX_PASSWORD_LENGTH, 'Password must be less than ${MAX_PASSWORD_LENGTH} characters'],
            select: false //Security Control; ensures that this field is excluded from queries (unless explicity asked)
        },
        firstName: {
            type: String,
            required: [true, 'First Name is required'],
            trim: true,
            maxlength: [50, 'First Name should be less than '],
        },
        lastName: {
            type: String,
            required: [true, 'Last Name is required'],
            trim: true,
            maxlength: [50, 'Last Name should be less than 50 characters'],
        },
        role: { //whitelisted roles
            type: String,
            enum: {
                values: VALID_ROLES,
                message: 'Role must be one of :{VALUE}',
            },
            default: 'user',
        },
        refreshTokens: [refreshTokenSchema],
    },
    {
        timestamps: true,
    }

);

//Pre-Save hook - only updates password if changed
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

//Compare Password method for userSchema

userSchema.methods.comparePassword = async function comparePassword(candidatePassword)
{
    return bcrypt.compare(candidatePassword, this.password);
}

//Ensure that password and version is removed when document is sent as a json to browser
userSchema.set('toJSON', {
    transform(_doc, ret) {
        delete ret.password;
        delete ret.__v
        return ret;
    },
});

//Create an explicit index for faster searching

userSchema.index({ email: 1 }); // 1 = ascending order

//Model Creation and Export

const User = mongoose.model('User', userSchema);

export { User };
export default User;

