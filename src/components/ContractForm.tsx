
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractFormData, ContractTemplate, ContractType } from "@/types";
import { Loader2 } from "lucide-react";
import { contractTemplates } from "@/config/contractTemplates";
import { AIService } from "@/services/aiService";

interface ContractFormProps {
  type: ContractType;
  onBack: () => void;
  onGenerated: (content: string) => void;
}

export const ContractForm = ({ type, onBack, onGenerated }: ContractFormProps) => {
  const template = contractTemplates.find((t) => t.id === type) as ContractTemplate;
  const [formData, setFormData] = useState<ContractFormData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const content = await AIService.generateContract(
        type,
        formData,
        template.sample
      );
      onGenerated(content);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className="min-h-[100px]"
          />
        );
      case "select":
        return (
          <Select 
            onValueChange={(value) => handleChange(field.id, value)}
            value={formData[field.id] || ""}
            required={field.required}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            id={field.id}
            value={formData[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      default:
        return (
          <Input
            type="text"
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id] || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <Button variant="outline" onClick={onBack} className="mb-6">
        ← Back to Contract Types
      </Button>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-legal-gray">
        <h2 className="text-2xl font-bold mb-6 text-legal-navy">{template.name} Form</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {template.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {field.helpText && (
                  <p className="text-sm text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isGenerating} className="bg-legal-navy hover:bg-legal-accent">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Contract"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
