
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractType, ContractTemplate } from "@/types";
import { FileText, FilePen, File, Clipboard, Contract } from "lucide-react";
import { contractTemplates } from "@/config/contractTemplates";

interface ContractTypeSelectorProps {
  onSelect: (type: ContractType) => void;
}

export const ContractTypeSelector = ({ onSelect }: ContractTypeSelectorProps) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "file-text":
        return <FileText className="h-8 w-8 text-legal-navy" />;
      case "file-pen":
        return <FilePen className="h-8 w-8 text-legal-navy" />;
      case "file":
        return <File className="h-8 w-8 text-legal-navy" />;
      case "clipboard":
        return <Clipboard className="h-8 w-8 text-legal-navy" />;
      case "contract":
      default:
        return <FileText className="h-8 w-8 text-legal-navy" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {contractTemplates.map((template) => (
        <Card 
          key={template.id}
          className="cursor-pointer hover:shadow-lg transition-shadow border-legal-gray hover:border-legal-accent"
          onClick={() => onSelect(template.id as ContractType)}
        >
          <CardHeader className="pb-2 flex flex-row items-center space-x-4">
            {getIcon(template.icon)}
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {template.fields.length} information fields required
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
