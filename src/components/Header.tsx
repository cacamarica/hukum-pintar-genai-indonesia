
import { useApiKey } from "@/context/ApiKeyContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Gavel } from "lucide-react";

export const Header = () => {
  const { isApiKeySet, setApiKey, clearApiKey } = useApiKey();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSetApiKey = () => {
    setApiKey(apiKeyInput);
    setApiKeyInput("");
    setIsDialogOpen(false);
  };

  return (
    <header className="bg-legal-navy text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Gavel className="h-8 w-8" />
          <h1 className="text-2xl font-bold">LegalAssist AI</h1>
        </div>
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={isApiKeySet ? "outline" : "default"}>
                {isApiKeySet ? "Change API Key" : "Set OpenAI API Key"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>OpenAI API Key</DialogTitle>
                <DialogDescription>
                  Your API key is stored locally in your browser and never sent to our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="api-key" className="text-right">
                    API Key
                  </Label>
                  <Input
                    id="api-key"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                {isApiKeySet && (
                  <Button variant="destructive" onClick={clearApiKey}>
                    Clear API Key
                  </Button>
                )}
                <Button onClick={handleSetApiKey}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
};
