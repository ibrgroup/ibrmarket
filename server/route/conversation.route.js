import { Router } from 'express';
import {
	createOrGetPeer,
	createOrGetSupport,
	getConversation,
	listMessages,
	listMyConversations,
	postMessage,
	uploadChatImages,
} from '../controllers/conversation.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { validateBody } from '../middlewares/validateBody.js';
import { chatMessageBodySchema, peerConversationSchema } from '../validation/schemas.js';

const conversationRouter = Router();

conversationRouter.use(auth);

conversationRouter.get('/', listMyConversations);
conversationRouter.post('/support', createOrGetSupport);
conversationRouter.post('/peer', validateBody(peerConversationSchema), createOrGetPeer);

conversationRouter.get('/:id/messages', listMessages);
conversationRouter.post('/:id/upload-images', upload.array('images', 5), uploadChatImages);
conversationRouter.post('/:id/messages', validateBody(chatMessageBodySchema), postMessage);
conversationRouter.get('/:id', getConversation);

export default conversationRouter;
