import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { GemmaClient } from '../services/gemma/GemmaClient';
import { callOpenRouterAPI } from '../services/disaster-api';

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

// Main hook for Gemma API interaction
export const useGemmaApi = () => {

    // State to store all chat messages
    const [messages, setMessages] = useState<Message[]>([]);

    // Function to get a completion from Gemma or OpenRouter
    const getCompletion = async (prompt: string) => {

        // Create a new user message with the prompt
        const userMessage: Message = {
            content: prompt,
            role: Role.User,
        };

        // Update messages state with the new user message
        const chatHistory = [...messages, userMessage];
        setMessages(chatHistory);

        try {
            // Create Gemma instance (no API key needed for local model)
            const gemma = new GemmaClient();
            const completion = await gemma.createChatCompletion({
                model: 'google/gemma-3n-E2B-it',
                messages: chatHistory,
            });

            // Extract the AI's response text
            const aiResponse = completion.choices[0].message.content?.trim() || 'An error occurred';

            // Create a new AI message with the AI's response
            const aiMessage: Message = {
                content: aiResponse,
                role: Role.Assistant,
            };

            // Update messages state with the new AI message
            setMessages((prevMessages) => [...prevMessages, aiMessage]);

        } catch (error) {
            // Handle any errors that occur during the completion request
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';

            // Create a new AI message with the error message
            const aiMessage: Message = {
                content: errorMessage,
                role: Role.Assistant,
            };

            // Update messages state with the new AI message
            setMessages((prevMessages) => [...prevMessages, aiMessage]);
        }
    };

    // Function to generate an image based on the user prompt
    const generateImage = async (prompt: string) => {
        const errorMessage = 'Image generation is not available in offline mode';
        
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

    // Function to convert speech to text using local processing
    const speechToText = async (audioUri: string) => {
        // TODO: Implement local speech-to-text with Gemma multimodal capabilities
        const errorMessage = 'Speech-to-text is not yet implemented in offline mode';
        
        if (Platform.OS === 'web') {
            window.alert(errorMessage);
        } else {
            Alert.alert('Feature Coming Soon', errorMessage);
        }

        return { text: '' };
    };

    return {
        messages,
        getCompletion,
        generateImage,
        speechToText
    };
};