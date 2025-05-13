
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIService } from "@/services/aiService";
import { ReviewResult } from "@/types";
import { Loader2, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface ContractPreviewProps {
  content: string;
  onBack: () => void;
  onEdit: (content: string) => void;
}

export const ContractPreview = ({ content, onBack, onEdit }: ContractPreviewProps) => {
  const { toast } = useToast();
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  
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
  
  const handleDownload = () => {
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
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
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
