import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const LoadingCard = ({ title }: { title: string }) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Analyzing {title}...</p>
        <p className="text-xs text-muted-foreground mt-1">PulseSpark.ai is working</p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
    </CardContent>
  </Card>
);