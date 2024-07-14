import { Router } from 'express';
import { roastUser } from '../controllers/github.controller';
import { Request, Response } from "express";

const router = Router();

router.get('/roast/:username', roastUser);
router.route('/').get((_req, res:Response) => res.send('Hello World!'));
module.exports = router