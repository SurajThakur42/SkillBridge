import { Router, Response, Request } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { AiService } from '../services/aiService.js';

export const aiRouter = Router();

// POST /api/ai/voice-transcribe - Whisper/Gemini High-Accuracy Audio Transcription & Intent Parsing
aiRouter.post('/voice-transcribe', async (req: Request, res: Response) => {
  const { audio, mimeType, currentPath, currentRole } = req.body;

  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'Audio base64 data is required' });
  }

  try {
    const result = await AiService.transcribeAndProcessVoiceAudio({
      base64Audio: audio,
      mimeType: mimeType || 'audio/webm',
      currentPath: currentPath || '/',
      currentRole: currentRole || 'LEARNER'
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Error in voice audio transcription:', err);
    return res.status(500).json({
      error: 'Failed to transcribe and parse audio',
      fallback: AiService.parseVoiceText('voice command', currentPath, currentRole)
    });
  }
});

// POST /api/ai/voice-parse - Smart Semantic Parser for Voice Text Commands
aiRouter.post('/voice-parse', async (req: Request, res: Response) => {
  const { text, currentPath, currentRole } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text string is required' });
  }

  try {
    const result = AiService.parseVoiceText(text.trim(), currentPath || '/', currentRole || 'LEARNER');
    return res.json(result);
  } catch (err: any) {
    console.error('Error in voice text parsing:', err);
    return res.status(500).json({ error: 'Failed to parse voice text' });
  }
});

// POST /api/ai/chat - Capacity AI copilot
aiRouter.post('/chat', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId!;
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question string is required' });
  }

  try {
    const result = await AiService.answerLearnerQuery(userId, question.trim());
    return res.json(result);
  } catch (err: any) {
    console.error('Error handling AI chat request:', err);
    return res.status(500).json({ error: 'Failed to process AI guidance request' });
  }
});

