// Chat message types used by GemmaClient
export enum Role {
    System = "system",
    User = "user",
    Assistant = "assistant",
}

export interface Message {
    role: Role;
    content: string;
}

export interface Choice {
    index: number;
    message: Message;
    logprobs: null;
    finish_reason: string;
}

export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    choices: Choice[];
}