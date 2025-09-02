import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { showToast } from "@/lib/toast";

const GitHubExportButton = () => {
  const handleExport = () => {
    showToast.success("GitHub export feature will be available soon!");
  };

  return (
    <Button 
      onClick={handleExport}
      variant="outline" 
      className="flex items-center gap-2"
    >
      <Github className="w-4 h-4" />
      Export to GitHub
    </Button>
  );
};

export default GitHubExportButton;