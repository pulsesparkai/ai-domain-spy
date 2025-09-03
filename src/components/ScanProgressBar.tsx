import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScanProgressBarProps {
  progress: number;
  isVisible: boolean;
  className?: string;
}

const ScanProgressBar = ({ progress, isVisible, className }: ScanProgressBarProps) => {
  if (!isVisible) return null;

  return (
    <div className={cn("w-full bg-background", className)}>
      <Progress 
        value={progress} 
        className="w-full h-2"
      />
      <div className="text-center text-sm text-muted-foreground mt-2">
        Scanning... {Math.round(progress)}%
      </div>
    </div>
  );
};

export default ScanProgressBar;