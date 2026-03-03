import User from '../models/User.js';
import AppError from '../utils/AppError.js';

//Define Allowed Fields that can be updated 
const  ALLOWED_UPDATED_FIELDS = ['firstName', 'lastName'];

//Exported Functions Below:

export async function getOwnProfile(userId) {
    const user = await User.findById(userId).select(
        'email firstName lastName role createdAt'
    );

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
}

export async function updateOwnProfile(userId, updates) {
    const filteredUpdates = {};

    //Onlyy allow Allowed Fields
    for (const key of Object.keys(updates)) {
        if (ALLOWED_UPDATED_FIELDS.includes(key)){
            filteredUpdates [key] = updates[key];
        }
    }

    //Check if there is anything to update
    if (Object.keys(filteredUpdates).length === 0) {
        throw new AppError(
            `No valid fields to update. Allowed fields are: ${ALLOWED_UPDATED_FIELDS.join(', ')}`, 400
        );
    }

    //Apply the update
    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
        new: true,   //Return the updated document
        runValidators: true,  //still enforce schema validations
    }).select('email firstName lastName role createdAt');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;

}

//listAllUsers - Admin function
export async function listAllUsers(){
    const users = await User.find()
    .select('email firstName lastName role createdAt')
    .sort({ createdAt: -1 }); // Newest first

  return users;
}
