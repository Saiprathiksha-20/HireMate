const{Router}=require("express")
const authController=require("../controllers/auth.controller")
const authRouter=Router()
const authMiddleware=require("../middlewares/auth.middleware")
const {authLimiter}=require("../middlewares/rateLimit.middleware")

/**
 * @route POST /api/auth//register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authLimiter, authController.registerUserController)
/**
 * @route POST /api/auth/login
 * @description Login a user
 * @access Public
 */
authRouter.post("/login", authLimiter, authController.loginUserController)


/**
 * @route GET /api/auth/logout
 * @description clear token from user cookie and add the token to blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController)


/**
 * @route GET /api/auth/get-me
 * @description get the logged in user details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)


// ═════════════════════════════ NEW ROUTES ═════════════════════════════

/**
 * @route PATCH /api/auth/profile
 * @description update username / email. body: { username?, email? }
 * @access Private
 */
authRouter.patch("/profile", authMiddleware.authUser, authController.updateProfileController)

/**
 * @route PATCH /api/auth/change-password
 * @description body: { currentPassword, newPassword }
 * @access Private
 */
authRouter.patch("/change-password", authMiddleware.authUser, authController.changePasswordController)

/**
 * @route DELETE /api/auth/account
 * @description delete account + all reports. body: { password }
 * @access Private
 */
authRouter.delete("/account", authMiddleware.authUser, authController.deleteAccountController)


module.exports=authRouter   