import express from 'express';  
import verifyFirebaseToken from '../middlewares/firebaseAuth.middleware.js';
import { registerOrLoginUser,deleteUser,getCurrentUser,updateUser,getAllUsers } from '../controllers/userController.js';

const router = express.Router();

// import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';

router.post('/register-or-login', verifyFirebaseToken, registerOrLoginUser);
router.get('/current-user', verifyFirebaseToken, getCurrentUser);
router.put('/update-user', verifyFirebaseToken, updateUser);
router.delete('/delete-user', verifyFirebaseToken, deleteUser);
router.get('/all-users', verifyFirebaseToken, getAllUsers);
export default router;
