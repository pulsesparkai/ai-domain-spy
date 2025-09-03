import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeAndValidateApiKey } from "@/lib/input-sanitizer";

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  isValid?: boolean;
  className?: string;
}

export const ApiKeyInput = ({
  label,
  value,
  onChange,
  placeholder = "Enter your API key...",
  description,
  isValid,
  className
}: ApiKeyInputProps) => {
  const [showKey, setShowKey] = React.useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2">
        <Key className="w-4 h-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => {
            const sanitizedResult = sanitizeAndValidateApiKey(e.target.value);
            onChange(sanitizedResult.sanitizedApiKey || e.target.value);
          }}
          placeholder={placeholder}
          className={cn(
            "pr-10",
            isValid === true && "border-green-500",
            isValid === false && "border-red-500"
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {isValid === true && (
        <p className="text-sm text-green-600">✓ API key is valid</p>
      )}
      {isValid === false && (
        <p className="text-sm text-red-600">✗ API key is invalid</p>
      )}
    </div>
  );
};