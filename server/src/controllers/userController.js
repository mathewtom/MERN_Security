import * as userService from '../services/userService.js';

//Define a CLOSURE function to catch errors, rather than doing try/catch in every function
function catchAsync(fn) {
    return (req, res, next) => {
        fn(req,res,next).catch(next);
    };
}


//Exported functions below:

//Function to get user's own profile:
export const getMe = catchAsync(async (req,res) => {
    const user = await getService.getOwnProfile(req.user.id);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

//Function to update user's own profile:
export const updateMe = catchAsync(async(req, res) => {
    const user = await userService.updateOwnProfile(req.user.id, req.body);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

//Function to list all users - Admin role
export const listUsers = catchAsync(async (req, res) => {
    const users = await userService.listAllUsers();

    res.status(200).json({
        status: 'success',
        results: users.length, 
        data: { users },
    });
});


