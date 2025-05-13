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
import { saveAs } from 'file-saver';

interface ContractPreviewProps {
  content: string;
  contractType?: string;
  formData?: Record<string, string>;
  onBack: () => void;
  onEdit: (content: string) => void;
}

export const ContractPreview = ({ content, contractType = '', formData = {}, onBack, onEdit }: ContractPreviewProps) => {
  const { toast } = useToast();
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  // Generate descriptive filename based on contract type and parties
  const generateContractFilename = (extension: string): string => {
    // Default filename if we can't identify parties
    let filename = `contract-${Date.now()}${extension}`;
    
    try {
      // Identify parties based on contract type
      if (contractType && formData) {
        // Different contract types have different field names for the parties
        let firstParty = '';
        let secondParty = '';
        
        switch (contractType) {
          case 'commercial':
            firstParty = formData.partyA || '';
            secondParty = formData.partyB || '';
            break;
          case 'partnership':
            firstParty = formData.partnerA || '';
            secondParty = formData.partnerB || '';
            break;
          case 'employment':
            firstParty = formData.employerName || '';
            secondParty = formData.employeeName || '';
            break;
          case 'nda':
            firstParty = formData.disclosingParty || '';
            secondParty = formData.receivingParty || '';
            break;
          case 'vendor':
            firstParty = formData.clientName || '';
            secondParty = formData.vendorName || '';
            break;
        }
        
        // If we have both party names, create a descriptive filename
        if (firstParty && secondParty) {
          // Clean the names (remove spaces, special chars)
          firstParty = firstParty.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
          secondParty = secondParty.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
          
          filename = `${contractType}_${firstParty}_with_${secondParty}_agreement${extension}`;
        }
      }
    } catch (error) {
      console.warn("Error generating filename:", error);
    }
    
    return filename;
  };

  // Format contract content for proper display
  const formatContractContent = (text: string) => {
    // Split the text by lines
    const lines = text.split('\n');
    
    // Process each line with formatting
    return lines.map((line, index) => {
      // Check if it's a header (all caps or starts with numbers like "1." or "1.1.")
      const isHeader = line.toUpperCase() === line && line.trim() !== '' && line.length > 3;
      const isNumberedSection = /^\d+(\.\d+)*\.?\s+[A-Z]/.test(line);
      
      // Format any text enclosed in ** as bold
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, (match, content) => {
        return `<strong>${content}</strong>`;
      });
      
      // Apply different styling based on line type
      if (isHeader) {
        return <h2 key={index} className="font-bold text-lg mb-2 mt-4" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
      } else if (isNumberedSection) {
        return <h3 key={index} className="font-semibold mb-2 mt-3" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
      } else if (line.trim() === '') {
        return <div key={index} className="h-4"></div>; // Empty line spacing
      } else {
        return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
      }
    });
  };

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
    // Create a Blob with text/plain MIME type
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    
    // Use the FileSaver approach which works better across browsers
    saveAs(blob, generateContractFilename('.txt'));
    
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
      
      // Since creating a true .docx in the browser is complex,
      // we'll use a library like docx.js in a production app
      // For now, we'll use an improved method that works better with Word
      
      // Convert contract content to HTML with proper styling
      const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 1cm; line-height: 1.5; }
          h1 { text-align: center; }
          strong { font-weight: bold; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="content">${content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}</div>
      </body>
      </html>`;
      
      // Force download as MS Word document using application/msword MIME type
      // This is more compatible with MS Word than the previous MIME type
      const blob = new Blob([htmlContent], { type: "application/msword" });
      
      // Use FileSaver approach for more reliable downloads
      saveAs(blob, generateContractFilename('.doc'));
      
      toast({
        title: "Contract Downloaded",
        description: "The contract has been downloaded as a Word document.",
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
            
            <div className="border border-gray-200 rounded-md p-6 bg-white overflow-auto max-h-[70vh] contract-document">
              <div className="font-serif text-base leading-relaxed">
                {formatContractContent(content)}
              </div>
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
