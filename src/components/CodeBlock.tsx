import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({ code, language = 'javascript', className = '' }: CodeBlockProps) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <pre className={`rounded-lg overflow-x-auto ${className}`}>
      <code 
        className={`language-${language}`}
        style={{ 
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '14px'
        }}
      >
        {code}
      </code>
    </pre>
  );
};