import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAccessibleForm, useScreenReader } from '@/hooks/useAccessibility';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox';
  value: any;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: Array<{ test: (val: any) => boolean; message: string }>;
  helpText?: string;
  placeholder?: string;
}

interface AccessibleFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onFieldChange: (fieldId: string, value: any) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  title,
  description,
  fields,
  onSubmit,
  onFieldChange,
  submitLabel = 'Submit',
  isSubmitting = false,
  errors = {}
}) => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const formRef = useRef<HTMLFormElement>(null);
  const { validateField } = useAccessibleForm();
  const { announceError, announceSuccess } = useScreenReader();

  const handleFieldChange = (field: FormField, value: any) => {
    onFieldChange(field.id, value);
    
    // Mark field as touched
    if (!touched[field.id]) {
      setTouched(prev => ({ ...prev, [field.id]: true }));
    }
    
    // Validate field if it has validation rules
    if (field.validation && touched[field.id]) {
      const validation = validateField(value, field.validation, field.label);
      setFieldErrors(prev => ({
        ...prev,
        [field.id]: validation.isValid ? '' : validation.message
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    let hasErrors = false;
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && (!field.value || field.value === '')) {
        newErrors[field.id] = `${field.label} is required`;
        hasErrors = true;
      } else if (field.validation) {
        const validation = validateField(field.value, field.validation, field.label);
        if (!validation.isValid) {
          newErrors[field.id] = validation.message;
          hasErrors = true;
        }
      }
    });
    
    setFieldErrors(newErrors);
    
    if (hasErrors) {
      const firstErrorField = fields.find(field => newErrors[field.id]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField.id);
        element?.focus();
        announceError(`Form has errors. Please check ${firstErrorField.label}.`);
      }
      return;
    }
    
    // Submit form data
    const formData = fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, any>);
    
    onSubmit(formData);
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const getFieldError = (fieldId: string) => {
    return fieldErrors[fieldId] || errors[fieldId] || '';
  };

  const hasFieldError = (fieldId: string) => {
    return !!getFieldError(fieldId);
  };

  const renderField = (field: FormField) => {
    const error = getFieldError(field.id);
    const hasError = hasFieldError(field.id);
    const helpTextId = `${field.id}-help`;
    const errorId = `${field.id}-error`;

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && (
                <span className="text-destructive" aria-label="required">*</span>
              )}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={field.value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              aria-describedby={[
                field.helpText ? helpTextId : '',
                hasError ? errorId : ''
              ].filter(Boolean).join(' ') || undefined}
              aria-invalid={hasError}
              className={hasError ? 'border-destructive focus:ring-destructive' : ''}
            />
            {field.helpText && (
              <p id={helpTextId} className="text-sm text-muted-foreground">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <div id={errorId} className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        );

      case 'password':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && (
                <span className="text-destructive" aria-label="required">*</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id={field.id}
                type={showPasswords[field.id] ? 'text' : 'password'}
                value={field.value || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                aria-describedby={[
                  field.helpText ? helpTextId : '',
                  hasError ? errorId : ''
                ].filter(Boolean).join(' ') || undefined}
                aria-invalid={hasError}
                className={`pr-10 ${hasError ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => togglePasswordVisibility(field.id)}
                aria-label={showPasswords[field.id] ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPasswords[field.id] ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            {field.helpText && (
              <p id={helpTextId} className="text-sm text-muted-foreground">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <div id={errorId} className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && (
                <span className="text-destructive" aria-label="required">*</span>
              )}
            </Label>
            <Textarea
              id={field.id}
              value={field.value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              aria-describedby={[
                field.helpText ? helpTextId : '',
                hasError ? errorId : ''
              ].filter(Boolean).join(' ') || undefined}
              aria-invalid={hasError}
              className={hasError ? 'border-destructive focus:ring-destructive' : ''}
              rows={4}
            />
            {field.helpText && (
              <p id={helpTextId} className="text-sm text-muted-foreground">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <div id={errorId} className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && (
                <span className="text-destructive" aria-label="required">*</span>
              )}
            </Label>
            <Select
              value={field.value || ''}
              onValueChange={(value) => handleFieldChange(field, value)}
              required={field.required}
            >
              <SelectTrigger 
                id={field.id}
                aria-describedby={[
                  field.helpText ? helpTextId : '',
                  hasError ? errorId : ''
                ].filter(Boolean).join(' ') || undefined}
                aria-invalid={hasError}
                className={hasError ? 'border-destructive focus:ring-destructive' : ''}
              >
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p id={helpTextId} className="text-sm text-muted-foreground">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <div id={errorId} className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={field.value || false}
                onCheckedChange={(checked) => handleFieldChange(field, checked)}
                required={field.required}
                aria-describedby={[
                  field.helpText ? helpTextId : '',
                  hasError ? errorId : ''
                ].filter(Boolean).join(' ') || undefined}
                aria-invalid={hasError}
                className={hasError ? 'border-destructive' : ''}
              />
              <Label htmlFor={field.id} className="flex items-center gap-1">
                {field.label}
                {field.required && (
                  <span className="text-destructive" aria-label="required">*</span>
                )}
              </Label>
            </div>
            {field.helpText && (
              <p id={helpTextId} className="text-sm text-muted-foreground ml-6">
                {field.helpText}
              </p>
            )}
            {hasError && (
              <div id={errorId} className="flex items-center gap-2 text-sm text-destructive ml-6" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Form error summary */}
          {Object.keys(fieldErrors).length > 0 && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Please correct the following errors:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {Object.entries(fieldErrors).map(([fieldId, error]) => {
                    const field = fields.find(f => f.id === fieldId);
                    return error ? (
                      <li key={fieldId}>
                        <button
                          type="button"
                          className="underline hover:no-underline"
                          onClick={() => document.getElementById(fieldId)?.focus()}
                        >
                          {field?.label}: {error}
                        </button>
                      </li>
                    ) : null;
                  })}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Form fields */}
          {fields.map(renderField)}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            aria-describedby="submit-status"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              submitLabel
            )}
          </Button>
          
          <div id="submit-status" className="sr-only" aria-live="polite">
            {isSubmitting ? 'Form is being submitted' : 'Ready to submit'}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};