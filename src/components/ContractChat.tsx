import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIService } from "@/services/aiService";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, Download, FileText, RefreshCcw, ThumbsUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { ContractFormData } from "@/types";

type Message = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface ContractChatProps {
  initialContract: string;
  contractType: string;
  formData: ContractFormData;
  onBack: () => void;
}

export const ContractChat = ({ 
  initialContract, 
  contractType, 
  formData, 
  onBack 
}: ContractChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-contract',
      role: 'assistant',
      content: initialContract,
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentContract, setCurrentContract] = useState(initialContract);
  const [downloading, setDownloading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    setIsProcessing(true);
    
    try {
      // Add a temporary "thinking" message
      const thinkingId = `thinking-${Date.now()}`;
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          id: thinkingId, 
          role: 'system', 
          content: 'Analyzing your request and updating the contract...', 
          timestamp: new Date() 
        }
      ]);
      
      // Get the revised contract based on the user's instructions
      const revisedContract = await AIService.reviseContract(
        currentContract,
        userInput,
        contractType
      );
      
      // Remove the thinking message
      setMessages(prevMessages => prevMessages.filter(m => m.id !== thinkingId));
      
      // Add the AI response
      const aiResponse: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: revisedContract,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setCurrentContract(revisedContract);
      
      toast({
        title: "Contract Updated",
        description: "The contract has been revised based on your instructions.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      
      // Remove the thinking message on error
      setMessages(prevMessages => prevMessages.filter(m => m.id.startsWith('thinking-') ? false : true));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRegenerateContract = async () => {
    setIsProcessing(true);
    
    try {
      const regeneratedContract = await AIService.generateContract(
        contractType,
        formData,
        ""  // No template for regeneration
      );
      
      const regenerateMessage: Message = {
        id: `regenerate-${Date.now()}`,
        role: 'system',
        content: "Contract regenerated from scratch.",
        timestamp: new Date()
      };
      
      const newContractMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: regeneratedContract,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, regenerateMessage, newContractMessage]);
      setCurrentContract(regeneratedContract);
      
      toast({
        title: "Contract Regenerated",
        description: "A new version of the contract has been generated.",
      });
    } catch (error) {
      toast({
        title: "Regeneration Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSaveChanges = () => {
    toast({
      title: "Changes Saved",
      description: "The current version of the contract has been saved.",
    });
  };
  
  const handleDownloadText = () => {
    const blob = new Blob([currentContract], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Contract Downloaded",
      description: "The contract has been downloaded as a text file.",
    });
  };
  
  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Using a simplified approach with HTML conversion
      const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 1cm; line-height: 1.5; }
          h1 { text-align: center; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="content">${currentContract.replace(/\n/g, '<br/>')}</div>
      </body>
      </html>`;
      
      // Convert the HTML to a Blob
      const blob = new Blob([htmlContent], { type: "text/html" });
      
      // Create a download link for the docx file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${Date.now()}.html`;  // Users will need to open in Word
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Contract Downloaded",
        description: "The contract has been downloaded. Open it with Microsoft Word to save as DOCX.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };
  
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // We'll use a similar approach for PDF, converting HTML to print
      const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 1cm; line-height: 1.5; }
          h1 { text-align: center; }
          .content { white-space: pre-wrap; }
          @media print {
            body { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="content">${currentContract.replace(/\n/g, '<br/>')}</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>`;
      
      // Open in a new window for printing to PDF
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        throw new Error("Unable to open print window. Please check your popup blocker settings.");
      }
      
      toast({
        title: "PDF Export",
        description: "A new window has opened. Use your browser's print function to save as PDF.",
      });
    } catch (error) {
      toast({
        title: "PDF Export Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Form
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRegenerateContract}
            disabled={isProcessing}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleSaveChanges}
            disabled={isProcessing}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {downloading ? "Processing..." : "Download"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDownloadText}>
                <FileText className="h-4 w-4 mr-2" />
                Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadDocx}>
                <FileText className="h-4 w-4 mr-2" />
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPdf}>
                <FileText className="h-4 w-4 mr-2" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex flex-col gap-2 p-4 h-full">
          <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : message.role === 'system' 
                          ? 'bg-muted text-muted-foreground italic text-sm' 
                          : 'bg-card border'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm">{message.content}</pre>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
            <Textarea
              placeholder="Request changes to the contract..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 min-h-[60px]"
              disabled={isProcessing}
            />
            <Button 
              type="submit" 
              className="self-end"
              disabled={!userInput.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};