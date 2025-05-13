import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useApiKey } from "@/context/ApiKeyContext";
import { Shield, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AIService } from "@/services/aiService";

export const ApiKeyRequired = () => {
  const { setApiKey } = useApiKey();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ 
    valid: boolean; 
    message: string;
  } | null>(null);

  const handleSetApiKey = async () => {
    setIsSubmitting(true);
    setApiKey(apiKeyInput);
    setIsSubmitting(false);
  };

  const handleVerifyApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setVerificationResult({
        valid: false,
        message: "Please enter an API key first"
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      // Temporarily set the API key for testing without saving it
      AIService.setApiKey(apiKeyInput);
      
      const result = await AIService.checkApiKey();
      setVerificationResult(result);
      
      // If the key is invalid, clear it to prevent it being saved
      if (!result.valid) {
        AIService.clearApiKey();
      }
    } catch (error) {
      setVerificationResult({ 
        valid: false, 
        message: `Error verifying API key: ${error instanceof Error ? error.message : String(error)}`
      });
      AIService.clearApiKey();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border border-legal-gray">
        <div className="mb-6 flex flex-col items-center text-center">
          <Shield className="h-12 w-12 text-legal-navy mb-4" />
          <h2 className="text-2xl font-bold text-legal-navy">API Key Required</h2>
          <p className="mt-2 text-gray-600">
            To use LegalAssist AI, please enter your OpenAI API key. Your key is stored locally in your browser and never sent to our servers.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              OpenAI API Key
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleVerifyApiKey}
              disabled={!apiKeyInput || isVerifying}
              variant="outline"
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Verify Connection</>
              )}
            </Button>

            <Button
              onClick={handleSetApiKey}
              disabled={!apiKeyInput || isSubmitting || isVerifying || (verificationResult && !verificationResult.valid)}
              className="flex-1 bg-legal-navy hover:bg-legal-accent"
            >
              {isSubmitting ? (
                "Setting API Key..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Continue
                </>
              )}
            </Button>
          </div>

          {verificationResult && (
            <Alert 
              variant={verificationResult.valid ? "default" : "destructive"}
              className="mt-4"
            >
              <AlertTitle>
                {verificationResult.valid ? "Connection Successful" : "Connection Failed"}
              </AlertTitle>
              <AlertDescription>{verificationResult.message}</AlertDescription>
            </Alert>
          )}
          
          <p className="text-xs text-center text-gray-500 mt-4">
            Don't have an OpenAI API key?{" "}
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-legal-accent hover:underline"
            >
              Get one here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
