import { Router } from 'express';
import { roastUser } from '../controllers/github.controller';

const router = Router();

router.get('/roast/:username', roastUser);
module.exports = router