import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  openaiConfig,
  geminiConfig,
  sarvamConfig,
  defaultProvider
} from '../../config/llm.json';
// import { SarvamAIClient } from 'sarvamai';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';


export type LLMProvider = 'openai' | 'gemini' | 'sarvam';
export type AssistantType = 'step' | 'hint';

@Injectable({
  providedIn: 'root',
})
export class LlmServiceService {
  openai = new OpenAI({ apiKey: openaiConfig.apiKey, dangerouslyAllowBrowser: true });

  googleAI = new GoogleGenerativeAI(geminiConfig.apiKey);
  // client = new SarvamAIClient({
  //   apiSubscriptionKey: sarvamConfig.apiKey,
  // });
  private rolePrompts: Record<AssistantType, string> = {
    step: '',
    hint: '',
  };

  constructor(private http: HttpClient) {}
  async askLLM({
    provider,
    prompt,
    context = '',
    role = 'hint',
  }: {
    provider: LLMProvider;
    prompt: string;
    context?: string;
    role: AssistantType;
  }): Promise<any> {
    switch (provider) {
      case 'openai':
        return await this.askOpenAI(prompt, context, role);
      case 'gemini':
        return await this.askGemini(prompt, context, role);
      // case 'sarvam':
      //   return await this.askSarvam(prompt, context, role);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async askOpenAI(
    prompt: string,
    context: string,
    role: AssistantType
  ): Promise<any> {
    const systemPrompt = this.rolePrompts[role];
    const response = await this.openai.chat.completions.create({
      model: openaiConfig.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${prompt}\n\n${context}` },
      ],
      temperature: 0.4,
    });
const raw = response.choices[0].message.content ?? '{}';
  return this.parseResponse(raw);  }

  private async askGemini(
    prompt: string,
    context: string,
    role: AssistantType
  ): Promise<any> {
    const model = this.googleAI.getGenerativeModel({
      model: geminiConfig.model,
      generationConfig: {
        temperature: 0.1,
        topP: 1,
        topK: 1,
        maxOutputTokens: 4096,
      },
    });

    const systemPrompt = this.rolePrompts[role];
    const result = await model.generateContent(
      `${systemPrompt}\n\n${prompt}\n`
    );
 const raw = result.response.text();
  return this.parseResponse(raw);  }

  // private async askSarvam(
  //   prompt: string,
  //   context: string,
  //   role: AssistantType
  // ): Promise<any> {
  //   const systemPrompt = this.rolePrompts[role];
  //   const res = await this.client.chat.completions({
  //     max_tokens: 8192,
  //     messages: [
  //       { role: 'system', content: systemPrompt },
  //       { role: 'user', content: `${prompt}\n\n${context}` },
  //     ],
  //   });

  //   const raw = res.choices?.[0]?.message?.content || '{}';
  //   return this.parseResponse(raw);
  // }

  setSystemPrompt(role: AssistantType, prompt: string): void {
    this.rolePrompts[role] = prompt;
  }
  async identifyStep({
  userObject,
  pendingSteps,
  labelSensitive,
}: {
  userObject: any;
  pendingSteps: any;
  labelSensitive: boolean;
}): Promise<any> {
  const prompt = JSON.stringify({
    userObject,
    pendingSteps,
    labelSensitive,
  });


  const response = await this.askLLM({
    provider: defaultProvider as LLMProvider,
    prompt,
    role: 'step',
  });

  return response;
}
async generateHints({
  config,
  completedStepMap,
}: {
  config: any;
  completedStepMap: Map<any, any>;
}): Promise<any> {
  const completedStepMapObject = Object.fromEntries(completedStepMap);

  const prompt = JSON.stringify({
    config,
    completedStepMapObject,
  });


  const response = await this.askLLM({
    provider: defaultProvider as LLMProvider,
    prompt,
    role: 'hint',
  });

  return response;
}

parseResponse(str: any): any {
  if (!str) return;

  // Remove markdown code block wrappers and smart quotes
  let cleaned = str
    .replace(/^```json|```$/g, '')          // remove ```json wrappers
    .replace(/[“”]/g, '"')                  // smart quotes to regular
    .trim();

  // Remove single quotes around JSON (e.g., from Gemini sometimes)
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Try extracting embedded JSON object or array
    const match = cleaned.match(/({[\s\S]*}|\[[\s\S]*\])/);
    const possibleJson = match ? match[0] : cleaned;

    try {
      return JSON.parse(possibleJson);
    } catch (_) {
      // Final attempt: try to repair
      try {
        const repaired = jsonrepair(possibleJson);
        return JSON.parse(repaired);
      } catch (error) {
        console.error('Unfixable JSON:', error);
        return {
          error: 'Failed to parse JSON',
          raw: str,
        };
      }
    }
  }
}


}
