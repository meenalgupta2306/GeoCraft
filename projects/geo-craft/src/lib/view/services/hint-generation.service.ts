import { Injectable } from '@angular/core';
import { openaiConfig } from '../../config/openai.json';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type AssistantType = 'step' | 'hint';

@Injectable({
  providedIn: 'root',
})
export class HintGenerationService {
  // llm-assistant.service.ts
  private assistantRegistry: {
    [key: string]: { assistantID: string; threadID?: string };
  } = {};

  private baseUrl = openaiConfig.openAIBaseUrl;
  private headers = new HttpHeaders({
    Authorization: `Bearer ${openaiConfig.openAIKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  async createAssistant(
    type: AssistantType,
    name: string,
    instructions: string
  ): Promise<string> {
    console.log('creatign assistant ----------------');
    const url = `${this.baseUrl}/assistants`;
    const body = {
      name,
      instructions,
      model: 'gpt-4o',
    };
    const res: any = await firstValueFrom(
      this.http.post(url, body, { headers: this.headers })
    );

    this.assistantRegistry[type] = {
      assistantID: res.id,
    };
    console.log(this.assistantRegistry);
    return res.id;
  }

  async createThreadFor(type: AssistantType): Promise<string> {
    const url = `${this.baseUrl}/threads`;
    const res: any = await firstValueFrom(
      this.http.post(url, {}, { headers: this.headers })
    );

    if (!this.assistantRegistry[type]) {
      throw new Error(`Assistant for ${type} not registered`);
    }

    this.assistantRegistry[type].threadID = res.id;
    return res.id;
  }

  async sendMessage(threadId: string, content: string): Promise<void> {
    const url = `${this.baseUrl}/threads/${threadId}/messages`;
    const body = { role: 'user', content };
    await firstValueFrom(this.http.post(url, body, { headers: this.headers }));
  }

  async runAssistant(threadId: string, assistantId: string): Promise<string> {
    const url = `${this.baseUrl}/threads/${threadId}/runs`;
    const body = { assistant_id: assistantId };
    const res: any = await firstValueFrom(
      this.http.post(url, body, { headers: this.headers })
    );
    return res.id;
  }

  async waitForCompletion(threadId: string, runId: string): Promise<void> {
    const url = `${this.baseUrl}/threads/${threadId}/runs/${runId}`;
    while (true) {
      const res: any = await firstValueFrom(
        this.http.get(url, { headers: this.headers })
      );
      if (res.status === 'completed') break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async getLatestResponse(threadId: string): Promise<string> {
    const url = `${this.baseUrl}/threads/${threadId}/messages`;
    const res: any = await firstValueFrom(
      this.http.get(url, { headers: this.headers })
    );
    const latest = res.data?.[0]?.content?.[0]?.text?.value || '';
    return latest;
  }

  async askAssistant(
    assistantId: string,
    threadId: string,
    message: string
  ): Promise<string> {
    await this.sendMessage(threadId, message);
    const runId = await this.runAssistant(threadId, assistantId);
    await this.waitForCompletion(threadId, runId);
    return await this.getLatestResponse(threadId);
  }
  getAssistantID(type: AssistantType): string {
    return this.assistantRegistry[type]?.assistantID ?? '';
  }

  getThreadID(type: AssistantType): string {
    return this.assistantRegistry[type]?.threadID ?? '';
  }

  async identifyStep(userObject: any, completedStepMap: any): Promise<string> {
    const assistantId = this.getAssistantID('step');
    const threadId = this.getThreadID('step');

    if (!assistantId || !threadId) {
      throw new Error('Assistant or thread not initialized');
    }

    // Prepare a combined prompt with user data and completed steps
    const prompt = JSON.stringify({
      userObject,
      completedStepMap,
    });

    const response = await this.askAssistant(assistantId, threadId, prompt);
    return response;
  }
  async generateHints(config: any, completedStepMap: any): Promise<string> {
    const assistantId = this.getAssistantID('hint');
    const threadId = this.getThreadID('hint');

    if (!assistantId || !threadId) {
      throw new Error('Assistant or thread not initialized');
    }

    // Prepare a combined prompt with user data and completed steps
    const prompt = JSON.stringify({
      config,
      completedStepMap,
    });

    const response = await this.askAssistant(assistantId, threadId, prompt);
    return response;
  }
  parseResponse(str: any) {
    // Remove markdown JSON code block wrappers
    let cleaned = str.replace(/^```json|```$/g, '').trim();

    // Remove wrapping single quotes if present
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }

    // Replace smart quotes with normal quotes
    cleaned = cleaned.replace(/[“”]/g, '"');

    // Attempt to fix unescaped inner double quotes inside string values
    // This is a heuristic — assumes problematic quotes follow a colon or comma and occur inside a string
    const escapeInnerQuotes = (s: any) => {
      return s.replace(
        /:\s*"([^"]*?)"([^",\]}])/g,
        (group1: any, group2: any) => {
          const escaped = group1.replace(/"/g, '\\"');
          return `: "${escaped}"${group2}`;
        }
      );
    };

    // Try parsing directly first
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // Fallback: try to escape unescaped inner quotes
      const fixed = escapeInnerQuotes(cleaned);
      try {
        return JSON.parse(fixed);
      } catch (error) {
        console.error('Failed to parse even after fix:', error);
        return {
          responseMessage: cleaned,
        };
      }
    }
  }
}
