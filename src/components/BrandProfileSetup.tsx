import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Building2, Globe, MapPin, Target, Users, Tag } from "lucide-react";
import { useBrandProfile, BrandProfileInput } from "@/hooks/useBrandProfile";

interface BrandProfileSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const BrandProfileSetup = ({ onComplete, onSkip }: BrandProfileSetupProps) => {
  const { createBrandProfile, loading } = useBrandProfile();
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand_name.trim()) {
      return;
    }

    const result = await createBrandProfile(formData);
    if (result && onComplete) {
      onComplete();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Set Up Your Brand Profile
        </CardTitle>
        <p className="text-muted-foreground">
          Configure your brand information to enable smart scan auto-population and personalized insights.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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

          {/* Competitors */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Competitors
            </h3>
            
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
            <h3 className="font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Brand Keywords
            </h3>
            
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

          {/* Target Audience */}
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !formData.brand_name.trim()}>
              {loading ? 'Creating Profile...' : 'Create Brand Profile'}
            </Button>
            {onSkip && (
              <Button type="button" variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};