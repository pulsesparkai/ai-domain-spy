// Updated CodeBlock to use lazy loading
import { LazyCodeBlock } from './lazy/LazyCodeBlock';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = (props: CodeBlockProps) => {
  return <LazyCodeBlock {...props} />;
};