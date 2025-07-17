import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { OpenAI } from 'openai';
import { useApiKeyContext } from '../contexts/apiKeyContext';
import { RAGService } from '../services/rag/RAGService';
import { ResponseValidator } from '../services/rag/ResponseValidator';

// Enum for message roles
export enum Role {
    User = 'user',
    Assistant = 'assistant',
}

// Interface for messages
export interface Message {
    content: string;
    role: Role;
}

// Main hook for RAG + ChatGPT API interaction
export const useRAGApi = () => {

    // State to store all chat messages
    const [messages, setMessages] = useState<Message[]>([]);

    // Retrieve API key from useApiKey hook
    const { apiKey } = useApiKeyContext();

    // RAG and validation services
    const ragService = RAGService.getInstance();
    const validator = ResponseValidator.getInstance();

    // Function to get a completion using ChatGPT + RAG
    const getCompletion = async (prompt: string) => {

        // Check if API key is not found
        if (!apiKey) {
            const errorMessage = 'No API key found';
            if (Platform.OS === 'web') {
                window.alert(errorMessage);
            } else {
                Alert.alert('Error', errorMessage);
            }
            return;
        }

        // Create a new user message with the prompt
        const userMessage: Message = {
            content: prompt,
            role: Role.User,
        };

        // Update messages state with the new user message
        const chatHistory = [...messages, userMessage];
        setMessages(chatHistory);

        try {
            // Step 1: Use RAG to process the query
            const ragContext = await ragService.processQuery(prompt);
            
            // Step 2: Create OpenAI instance with enhanced prompt
            const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
            
            // Step 3: Send the RAG-enhanced prompt to ChatGPT
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: ragContext.contextualPrompt
                    }
                ],
                temperature: 0.3, // Lower temperature for more consistent responses
                max_tokens: 300
            });

            // Step 4: Extract the AI's response
            let aiResponse = completion.choices[0].message.content?.trim() || 'An error occurred';

            // Step 5: Validate the response for safety
            const validationResult = validator.validateResponse(
                prompt,
                aiResponse,
                ragContext.relevantKnowledge
            );

            // Step 6: If validation fails, use safe fallback
            if (!validationResult.isValid) {
                console.warn('ChatGPT response validation failed:', validationResult.warnings);
                aiResponse = validator.getSafeResponse(prompt, validationResult);
            }

            // Step 7: Enhance response with emergency indicators and quick actions
            if (ragContext.emergencyPriority === 'critical') {
                aiResponse = `🚨 CRITICAL: ${aiResponse}`;
            } else if (ragContext.emergencyPriority === 'urgent') {
                aiResponse = `⚠️ URGENT: ${aiResponse}`;
            }

            // Add quick actions if available
            if (ragContext.quickActions && ragContext.quickActions.length > 0) {
                aiResponse += '\n\n**Quick Actions:**\n';
                ragContext.quickActions.forEach((action, index) => {
                    aiResponse += `${index + 1}. ${action}\n`;
                });
            }

            // Step 8: Create a new AI message with the processed response
            const aiMessage: Message = {
                content: aiResponse,
                role: Role.Assistant,
            };

            // Update messages state with the new AI message
            setMessages((prevMessages) => [...prevMessages, aiMessage]);

            // Log RAG context for debugging
            console.log('RAG Context:', {
                priority: ragContext.emergencyPriority,
                knowledgeUsed: ragContext.relevantKnowledge.length,
                quickActions: ragContext.quickActions.length,
                validationPassed: validationResult.isValid,
                validationConfidence: validationResult.confidence
            });

        } catch (error) {
            // Handle any errors that occur during the completion request
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            console.error('RAG API Error:', error);

            // Create a new AI message with the error message
            const aiMessage: Message = {
                content: `Error: ${errorMessage}. Please try again or contact emergency services if this is urgent.`,
                role: Role.Assistant,
            };

            // Update messages state with the new AI message
            setMessages((prevMessages) => [...prevMessages, aiMessage]);
        }
    };

    // Function to generate an image based on the user prompt
    const generateImage = async (prompt: string) => {
        const errorMessage = 'Image generation is not available in earthquake survival mode';
        
        if (Platform.OS === 'web') {
            window.alert(errorMessage);
        } else {
            Alert.alert('Feature Unavailable', errorMessage);
        }

        // Add user message to history
        const newUserMessage: Message = {
            content: prompt,
            role: Role.User,
        };
        setMessages([...messages, newUserMessage]);

        // Add error message to history
        const aiMessage: Message = {
            content: errorMessage,
            role: Role.Assistant,
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
    };

    // Function to convert speech to text using OpenAI
    const speechToText = async (audioUri: string) => {
        // Check if API key is not found
        if (!apiKey) {
            const errorMessage = 'No API key found';
            if (Platform.OS === 'web') {
                window.alert(errorMessage);
            } else {
                Alert.alert('Error', errorMessage);
            }
            return;
        }

        try {
            // Prepare form data for the request
            const formData = new FormData();
            const audioData = {
                uri: audioUri,
                type: 'audio/mp4',
                name: 'audio/m4a',
            };

            formData.append('model', 'whisper-1');
            formData.append('file', audioData as unknown as Blob);

            // Make a POST request to the OpenAI Whisper API
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            return response.json();

        } catch (error) {
            console.error('Error in speechToText:', error);
        }
    };

    return {
        messages,
        getCompletion,
        generateImage,
        speechToText
    };
};