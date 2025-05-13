import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Wifi, Database, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AIService } from "@/services/aiService";

interface ConnectionStatus {
  isConnected: boolean;
  message: string;
  isLoading?: boolean;
}

export function ConnectionStatus() {
  const [localServerStatus, setLocalServerStatus] = useState<ConnectionStatus>({
    isConnected: false,
    message: "Checking local server connection...",
    isLoading: true,
  });

  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus>({
    isConnected: false,
    message: "Checking Supabase connection...",
    isLoading: true,
  });

  const checkLocalServer = async () => {
    setLocalServerStatus({
      isConnected: false,
      message: "Checking local server connection...",
      isLoading: true,
    });

    try {
      const localServerUrl = "http://localhost:54321/health";
      const response = await fetch(localServerUrl, { 
        method: "GET",
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setLocalServerStatus({
          isConnected: true,
          message: `Local server is online. Port: 54321. Last check: ${new Date().toLocaleTimeString()}`,
          isLoading: false,
        });
      } else {
        setLocalServerStatus({
          isConnected: false,
          message: `Local server connection failed. Status: ${response.status}`,
          isLoading: false,
        });
      }
    } catch (error) {
      setLocalServerStatus({
        isConnected: false,
        message: `Cannot connect to local server on port 54321. Error: ${error instanceof Error ? error.message : String(error)}`,
        isLoading: false,
      });
    }
  };

  const checkSupabase = async () => {
    setSupabaseStatus({
      isConnected: false,
      message: "Checking Supabase connection...",
      isLoading: true,
    });

    try {
      // Try to ping Supabase with a simple query
      const { count, error } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true });
      
      if (error) {
        throw error;
      }

      setSupabaseStatus({
        isConnected: true,
        message: `Connected to Supabase successfully. Contracts table is accessible. Last check: ${new Date().toLocaleTimeString()}`,
        isLoading: false,
      });
    } catch (error) {
      setSupabaseStatus({
        isConnected: false,
        message: `Supabase connection failed. Error: ${error instanceof Error ? error.message : String(error)}`,
        isLoading: false,
      });
    }
  };

  const retryConnections = () => {
    checkLocalServer();
    checkSupabase();
    toast({
      title: "Retrying connections",
      description: "Checking all service connections again..."
    });
  };

  useEffect(() => {
    checkLocalServer();
    checkSupabase();
  }, []);

  const getStatusIcon = (status: ConnectionStatus) => {
    if (status.isLoading) {
      return <HelpCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
    return status.isConnected ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="mt-6 mb-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-legal-navy flex items-center gap-2">
        <HelpCircle className="h-5 w-5" />
        Connection Status
      </h2>
      
      <Alert variant={localServerStatus.isConnected ? "default" : "destructive"} className="border-l-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(localServerStatus)}
          <Wifi className="h-5 w-5" />
          <AlertTitle>Local Contract Generator</AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          {localServerStatus.message}
        </AlertDescription>
      </Alert>
      
      <Alert variant={supabaseStatus.isConnected ? "default" : "destructive"} className="border-l-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(supabaseStatus)}
          <Database className="h-5 w-5" />
          <AlertTitle>Supabase Database</AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          {supabaseStatus.message}
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button 
          variant="outline"
          onClick={retryConnections}
          className="text-sm"
        >
          Retry Connections
        </Button>
      </div>
    </div>
  );
}