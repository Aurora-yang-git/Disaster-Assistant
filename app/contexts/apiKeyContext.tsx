import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface ApiKeyContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
}

// Create API key context
const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

// API key context provider component
export const ApiKeyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [apiKey, setApiKeyState] = useState<string>('');

    // Load API key from storage on component mount
    useEffect(() => {
        const loadApiKey = async () => {
            try {
            const key = await AsyncStorage.getItem('apiKey');
                console.log('从AsyncStorage加载的API Key:', key ? `存在(长度:${key.length})` : '不存在');
                console.log('设置API Key状态:', key ? '有值' : '无值');
                setApiKeyState(key || '');
                console.log('API Key状态设置完成');
            } catch (error) {
                console.error('加载API Key失败:', error);
                setApiKeyState('');
            }
        };

        loadApiKey();
    }, []);

    // Function to update the API key state and save it to storage
    const setApiKey = async (key: string) => {
        setApiKeyState(key);
        await AsyncStorage.setItem('apiKey', key);
    };


    return (
        <ApiKeyContext.Provider value={{ apiKey, setApiKey }}>
            {children}
        </ApiKeyContext.Provider>
    );
};

// Custom hook to use the API key context
export const useApiKeyContext = (): ApiKeyContextType => {

    const context = useContext(ApiKeyContext);

    if (!context) {
        throw new Error('useApiKeyContext must be used within an ApiKeyContextProvider');
    }

    return context;
};