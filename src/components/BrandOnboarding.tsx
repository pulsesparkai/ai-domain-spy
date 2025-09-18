import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Plus, Building2, Globe, MapPin, Target, Users, Tag, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useBrandProfile, BrandProfileInput } from "@/hooks/useBrandProfile";
import confetti from 'canvas-confetti';

interface BrandOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
}

export const BrandOnboarding = ({ onComplete, onSkip, onClose }: BrandOnboardingProps) => {
  const { createBrandProfile, loading } = useBrandProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState<BrandProfileInput>({
    brand_name: '',
    brand_domain: '',
    industry: '',
    location: '',
    description: '',
    competitors: [],
    keywords: [],
    target_audience: ''
  });

  const [newCompetitor, setNewCompetitor] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const handleInputChange = (field: keyof BrandProfileInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !formData.competitors?.includes(newCompetitor.trim())) {
      setFormData(prev => ({
        ...prev,
        competitors: [...(prev.competitors || []), newCompetitor.trim()]
      }));
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors?.filter(c => c !== competitor) || []
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords?.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleComplete = async () => {
    if (!formData.brand_name.trim()) {
      return;
    }

    const result = await createBrandProfile(formData);
    if (result) {
      triggerConfetti();
      if (onComplete) {
        onComplete();
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.brand_name.trim() !== '';
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Brand Basics
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name *</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name}
                  onChange={(e) => handleInputChange('brand_name', e.target.value)}
                  placeholder="e.g., Acme Corp"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand_domain">Website Domain</Label>
                <Input
                  id="brand_domain"
                  type="url"
                  value={formData.brand_domain}
                  onChange={(e) => handleInputChange('brand_domain', e.target.value)}
                  placeholder="e.g., acmecorp.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brand Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your brand, products, or services..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Industry
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder="e.g., SaaS, E-commerce, Healthcare"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </Label>
              <Textarea
                id="target_audience"
                value={formData.target_audience}
                onChange={(e) => handleInputChange('target_audience', e.target.value)}
                placeholder="Describe your target audience, customer segments, or user personas..."
                rows={2}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Competitors & Keywords
            </h3>
            
            {/* Competitors */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Competitors</h4>
              
              <div className="flex gap-2">
                <Input
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="Add competitor name..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                />
                <Button type="button" onClick={addCompetitor} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.competitors && formData.competitors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.competitors.map((competitor, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {competitor}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCompetitor(competitor)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Brand Keywords
              </h4>
              
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add relevant keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.keywords && formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {keyword}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Brand Profile Setup
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Step {currentStep} of {totalSteps}: Set up your brand for intelligent scanning
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Brand Basics</span>
            <span>Location & Industry</span>
            <span>Competitors & Keywords</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {renderStep()}
          
          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              {onSkip && currentStep === 1 && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip for Now
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStep < totalSteps ? (
                <Button onClick={nextStep} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete} 
                  disabled={loading || !canProceed()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};