import { useCallback } from 'react';
import { useAppStateStore } from '@/store/appStateStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schemas for different input types
export const scanInputSchema = z.object({
  targetUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  scanType: z.enum(['brand-monitoring', 'competitor-analysis', 'content-optimization', 'domain-ranking']),
  queries: z.array(z.string().min(1, 'Query cannot be empty')).min(1, 'At least one query is required')
});

export const filterSchema = z.object({
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }),
  status: z.array(z.string()),
  platforms: z.array(z.string()),
  sentimentType: z.array(z.string())
});

export type ScanInputs = z.infer<typeof scanInputSchema>;
export type FilterInputs = z.infer<typeof filterSchema>;

// Hook for managing scan input forms
export const useScanInputForm = () => {
  const { scanInputs, updateScanInputs, resetScanInputs } = useAppStateStore();

  const form = useForm<ScanInputs>({
    resolver: zodResolver(scanInputSchema),
    defaultValues: {
      targetUrl: scanInputs.targetUrl,
      scanType: scanInputs.scanType as "brand-monitoring" | "competitor-analysis" | "content-optimization" | "domain-ranking",
      queries: scanInputs.queries
    },
    mode: 'onChange'
  });

  // Sync form with store
  const syncFormWithStore = useCallback(() => {
    form.reset({
      targetUrl: scanInputs.targetUrl,
      scanType: scanInputs.scanType as "brand-monitoring" | "competitor-analysis" | "content-optimization" | "domain-ranking",
      queries: scanInputs.queries
    });
  }, [form, scanInputs]);

  // Update store when form changes
  const handleInputChange = useCallback((field: keyof ScanInputs, value: any) => {
    updateScanInputs({ [field]: value });
    form.setValue(field, value);
  }, [updateScanInputs, form]);

  // Add query to the list
  const addQuery = useCallback(() => {
    const currentQueries = form.getValues('queries') || [];
    const newQueries = [...currentQueries, ''];
    handleInputChange('queries', newQueries);
  }, [form, handleInputChange]);

  // Remove query from the list
  const removeQuery = useCallback((index: number) => {
    const currentQueries = form.getValues('queries') || [];
    const newQueries = currentQueries.filter((_, i) => i !== index);
    handleInputChange('queries', newQueries);
  }, [form, handleInputChange]);

  // Update specific query
  const updateQuery = useCallback((index: number, value: string) => {
    const currentQueries = form.getValues('queries') || [];
    const newQueries = [...currentQueries];
    newQueries[index] = value;
    handleInputChange('queries', newQueries);
  }, [form, handleInputChange]);

  // Reset form and store
  const resetForm = useCallback(() => {
    resetScanInputs();
    form.reset();
  }, [resetScanInputs, form]);

  return {
    form,
    scanInputs,
    syncFormWithStore,
    handleInputChange,
    addQuery,
    removeQuery,
    updateQuery,
    resetForm,
    isValid: form.formState.isValid,
    errors: form.formState.errors
  };
};

// Hook for managing filter inputs
export const useFilterInputs = () => {
  const { filters, updateFilters, resetFilters } = useAppStateStore();

  const form = useForm<FilterInputs>({
    resolver: zodResolver(filterSchema),
    defaultValues: filters,
    mode: 'onChange'
  });

  // Quick filter presets
  const applyQuickFilter = useCallback((preset: string) => {
    const now = new Date();
    let dateRange = { from: '', to: '' };

    switch (preset) {
      case 'today':
        dateRange = {
          from: now.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        dateRange = {
          from: weekAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        dateRange = {
          from: monthAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
        break;
    }

    updateFilters({ dateRange });
    form.setValue('dateRange', dateRange);
  }, [updateFilters, form]);

  // Toggle filter value (for arrays)
  const toggleFilter = useCallback((filterType: 'status' | 'platforms' | 'sentimentType', value: string) => {
    const currentValues = filters[filterType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilters({ [filterType]: newValues });
    form.setValue(filterType, newValues);
  }, [filters, updateFilters, form]);

  // Clear specific filter
  const clearFilter = useCallback((filterType: keyof FilterInputs) => {
    const defaultValue = filterType === 'dateRange' 
      ? { from: '', to: '' }
      : [];
    
    updateFilters({ [filterType]: defaultValue });
    form.setValue(filterType, defaultValue as any);
  }, [updateFilters, form]);

  return {
    form,
    filters,
    applyQuickFilter,
    toggleFilter,
    clearFilter,
    resetFilters,
    hasActiveFilters: Object.values(filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : 
      typeof filter === 'object' ? filter.from || filter.to :
      false
    )
  };
};

// Hook for managing persistent user preferences
export const useUserInputPreferences = () => {
  const { updateScanInputs } = useAppStateStore();

  // Save input as template
  const saveAsTemplate = useCallback((inputs: ScanInputs, name: string) => {
    const templates = JSON.parse(localStorage.getItem('scan-templates') || '[]');
    const newTemplate = {
      id: Date.now().toString(),
      name,
      ...inputs,
      createdAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    localStorage.setItem('scan-templates', JSON.stringify(templates));
    
    return newTemplate;
  }, []);

  // Load saved templates
  const getTemplates = useCallback(() => {
    return JSON.parse(localStorage.getItem('scan-templates') || '[]');
  }, []);

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const templates = getTemplates();
    const template = templates.find((t: any) => t.id === templateId);
    
    if (template) {
      const { id, name, createdAt, ...inputs } = template;
      updateScanInputs(inputs);
    }
  }, [getTemplates, updateScanInputs]);

  // Delete template
  const deleteTemplate = useCallback((templateId: string) => {
    const templates = getTemplates();
    const filtered = templates.filter((t: any) => t.id !== templateId);
    localStorage.setItem('scan-templates', JSON.stringify(filtered));
  }, [getTemplates]);

  return {
    saveAsTemplate,
    getTemplates,
    applyTemplate,
    deleteTemplate
  };
};