import { requestUrl } from 'obsidian';
import AudioTranscriptionPlugin from '../main';
import { TranscriptionResult, AnalysisResult } from '../services/TranscriptionService';

export class OpenRouterProcessor {
	private plugin: AudioTranscriptionPlugin;
	private apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';

	constructor(plugin: AudioTranscriptionPlugin) {
		this.plugin = plugin;
	}

	transcribe(
		_audioPath: string,
		_onProgress?: (progress: number, message: string) => void
	): never {
		// Note: OpenRouter doesn't provide direct audio transcription
		// This would require using OpenAI Whisper through OpenRouter
		throw new Error('OpenRouter direct transcription not supported. Use OpenRouter for analysis only, or use OpenAI Whisper for transcription.');
	}

	async analyzeText(
		transcript: string,
		customInstructions?: string
	): Promise<AnalysisResult> {
		const apiKey = this.plugin.settings.openrouterApiKey;
		const modelName = this.plugin.settings.openrouterModelName;

		if (!apiKey) {
			throw new Error('OpenRouter API key not configured. Please add it in settings.');
		}

		if (!modelName) {
			throw new Error('OpenRouter model name not configured. Please specify a model in settings.');
		}

		// Build the analysis prompt
		const systemPrompt = this.buildAnalysisPrompt(customInstructions);

		try {
			const response = await requestUrl({
				url: this.apiEndpoint,
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
					'HTTP-Referer': 'https://github.com/obsidian-transcription-plugin',
					'X-Title': 'Obsidian Audio Transcription Plugin'
				},
				body: JSON.stringify({
					model: modelName,
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: `Please analyze this transcription:\n\n${transcript}`
						}
					],
					temperature: 0.7,
					max_tokens: 2000
				}),
				throw: false
			});

			if (response.status !== 200) {
				const errorData = response.json;
				const errorMessage = errorData?.error?.message || 'Unknown error';
				throw new Error(`OpenRouter API error: ${errorMessage}`);
			}

			const result = response.json;
			const content = result.choices?.[0]?.message?.content || '';

			return this.parseAnalysisResult(content);

		} catch (error) {
			console.error('OpenRouter API error:', error);
			throw new Error(`Analysis failed: ${error.message}`);
		}
	}

	private buildAnalysisPrompt(customInstructions?: string): string {
		let prompt = `You are an expert at analyzing meeting transcriptions and extracting actionable insights.

Your task is to analyze the provided transcription and extract the following information:

1. **Summary**: A brief 2-3 sentence overview of the main topics discussed
2. **Key Points**: A bulleted list of the most important points, decisions, or topics
3. **Action Items**: Specific tasks or actions that were assigned or need to be done (format as checkbox items with assignee if mentioned)
4. **Follow-up Questions**: Any unresolved questions or topics that need further discussion

Format your response as follows:

## Summary
[Your summary here]

## Key Points
- [Point 1]
- [Point 2]
- [Point 3]

## Action Items
- [ ] [Task 1] (@assignee if mentioned)
- [ ] [Task 2]

## Follow-up Questions
- [Question 1]
- [Question 2]
`;

		if (customInstructions) {
			prompt += `\n\nAdditional Instructions:\n${customInstructions}\n`;
		}

		return prompt;
	}

	private parseAnalysisResult(content: string): AnalysisResult {
		// Parse the markdown-formatted response
		const sections: AnalysisResult = {
			summary: '',
			keyPoints: [],
			actionItems: [],
			followUps: []
		};

		// Extract summary
		const summaryMatch = content.match(/## Summary\s+([\s\S]*?)(?=##|$)/i);
		if (summaryMatch) {
			sections.summary = summaryMatch[1].trim();
		}

		// Extract key points
		const keyPointsMatch = content.match(/## Key Points\s+([\s\S]*?)(?=##|$)/i);
		if (keyPointsMatch) {
			const points = keyPointsMatch[1].match(/^[-*]\s+(.+)$/gm);
			if (points) {
				sections.keyPoints = points.map(p => p.replace(/^[-*]\s+/, '').trim());
			}
		}

		// Extract action items
		const actionItemsMatch = content.match(/## Action Items\s+([\s\S]*?)(?=##|$)/i);
		if (actionItemsMatch) {
			const items = actionItemsMatch[1].match(/^[-*]\s+\[.\]\s+(.+)$/gm);
			if (items) {
				sections.actionItems = items.map(i => i.replace(/^[-*]\s+\[.\]\s+/, '').trim());
			}
		}

		// Extract follow-up questions
		const followUpsMatch = content.match(/## Follow-up Questions?\s+([\s\S]*?)(?=##|$)/i);
		if (followUpsMatch) {
			const questions = followUpsMatch[1].match(/^[-*]\s+(.+)$/gm);
			if (questions) {
				sections.followUps = questions.map(q => q.replace(/^[-*]\s+/, '').trim());
			}
		}

		return sections;
	}

	cancel() {
		// Cannot cancel HTTP requests easily
	}
}
