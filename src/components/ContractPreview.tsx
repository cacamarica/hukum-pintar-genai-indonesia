
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIService } from "@/services/aiService";
import { ReviewResult } from "@/types";
import { Loader2, Download, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface ContractPreviewProps {
  content: string;
  onBack: () => void;
  onEdit: (content: string) => void;
}

export const ContractPreview = ({ content, onBack, onEdit }: ContractPreviewProps) => {
  const { toast } = useToast();
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  const handleReview = async () => {
    setReviewing(true);
    
    try {
      const result = await AIService.reviewContract(content);
      setReviewResult(result);
      
      toast({
        title: "Contract Reviewed",
        description: `Completeness score: ${result.completeness}%`,
      });
      
      if (result.revisedContent) {
        onEdit(result.revisedContent);
      }
    } catch (error) {
      toast({
        title: "Review Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  };
  
  const handleDownloadText = () => {
    const blob = new Blob([content], { type: "text/plain" });
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
      
      if (!user) {
        throw new Error("User authentication required");
      }
      
      // Use client-side HTML to DOCX conversion
      // We're using a simplified approach here with HTML conversion
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
        <div class="content">${content.replace(/\n/g, '<br/>')}</div>
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User authentication required");
      }
      
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
        <div class="content">${content.replace(/\n/g, '<br/>')}</div>
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
    <div className="w-full max-w-6xl mx-auto mt-8">
      <Button variant="outline" onClick={onBack} className="mb-6">
        ← Back to Form
      </Button>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Contract Document */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-lg shadow-md border border-legal-gray">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-legal-navy">Contract Preview</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={handleReview} 
                  disabled={reviewing} 
                  variant="outline"
                  className="bg-legal-navy text-white hover:bg-legal-accent"
                >
                  {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {reviewing ? "Reviewing..." : "AI Review"}
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
            
            <div className="border border-gray-200 rounded-md p-6 bg-gray-50 overflow-auto max-h-[70vh]">
              <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
            </div>
          </div>
        </div>
        
        {/* Review Panel */}
        {reviewResult && (
          <div className="lg:w-96">
            <div className="bg-white p-6 rounded-lg shadow-md border border-legal-gray">
              <h3 className="text-lg font-bold mb-4 text-legal-navy">AI Review Results</h3>
              
              <div className="mb-6">
                <span className="text-sm font-medium">Completeness</span>
                <div className="flex items-center">
                  <Progress value={reviewResult.completeness} className="flex-1 mr-2" />
                  <span className="text-sm font-medium">{reviewResult.completeness}%</span>
                </div>
              </div>
              
              {reviewResult.suggestions?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    Suggestions
                  </h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {reviewResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {reviewResult.risks?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-1" />
                    Potential Risks
                  </h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {reviewResult.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
