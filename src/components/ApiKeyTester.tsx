import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AIService } from '@/services/aiService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ApiKeyTesterProps {
  autoTest?: boolean;
  showFullMessage?: boolean;
}

export const ApiKeyTester: React.FC<ApiKeyTesterProps> = ({ 
  autoTest = false,
  showFullMessage = true
}) => {
  const [isChecking, setIsChecking] = useState(autoTest);
  const [checkResult, setCheckResult] = useState<{ 
    valid: boolean; 
    message: string;
  } | null>(null);

  const checkApiKey = async () => {
    setIsChecking(true);
    setCheckResult(null);
    
    try {
      const result = await AIService.checkApiKey();
      setCheckResult(result);
    } catch (error) {
      setCheckResult({ 
        valid: false, 
        message: `Error checking API key: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleCheckApiKey = () => {
    checkApiKey();
  };
  
  // Automatically check API key when component mounts if autoTest is true
  useEffect(() => {
    if (autoTest) {
      checkApiKey();
    }
  }, [autoTest]);

  // If we just want the alert without the button
  if (!showFullMessage && checkResult) {
    return (
      <Alert variant={checkResult.valid ? "default" : "destructive"} className="mb-4">
        <div className="flex items-center gap-2">
          {checkResult.valid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {checkResult.valid 
              ? "Connection to AI engine is successful" 
              : "Failed to connect to AI engine"}
          </AlertTitle>
        </div>
        {showFullMessage && (
          <AlertDescription className="mt-2">{checkResult.message}</AlertDescription>
        )}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleCheckApiKey} 
        disabled={isChecking}
      >
        {isChecking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking API Key...
          </>
        ) : (
          <>Verify OpenAI API Key Connection</>
        )}
      </Button>

      {checkResult && (
        <Alert variant={checkResult.valid ? "default" : "destructive"} className="mt-4">
          <div className="flex items-center gap-2">
            {checkResult.valid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {checkResult.valid ? "Connection Successful" : "Connection Failed"}
            </AlertTitle>
          </div>
          <AlertDescription className="mt-2">{checkResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};