
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { AIService } from "@/services/aiService";

interface ApiKeyContextType {
  isApiKeySet: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = AIService.getApiKey();
    setIsApiKeySet(!!storedKey);
  }, []);

  const setApiKey = (key: string) => {
    AIService.setApiKey(key);
    setIsApiKeySet(true);
  };

  const clearApiKey = () => {
    AIService.clearApiKey();
    setIsApiKeySet(false);
  };

  return (
    <ApiKeyContext.Provider value={{ isApiKeySet, setApiKey, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
};
