import express from 'express';  
import { registerOrLoginUser,deleteUser,getCurrentUser,updateUser } from '../controllers/userController';
const router = express.Router();

router.post('/register-or-login', registerOrLoginUser);
router.get('/current-user', getCurrentUser);
router.put('/update-user', updateUser);
router.delete('/delete-user', deleteUser);

export default router;
