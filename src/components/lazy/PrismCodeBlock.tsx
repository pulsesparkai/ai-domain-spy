// Actual PrismJS implementation - loaded lazily
import { useEffect, useRef } from 'react';

// Import PrismJS dynamically to avoid bundling it initially
let Prism: any = null;

const loadPrism = async () => {
  if (!Prism) {
    const prismModule = await import('prismjs');
    await import('prismjs/themes/prism.css');
    await import('prismjs/components/prism-javascript');
    await import('prismjs/components/prism-json');
    await import('prismjs/components/prism-typescript');
    await import('prismjs/components/prism-jsx');
    await import('prismjs/components/prism-tsx');
    Prism = prismModule.default;
  }
  return Prism;
};

interface PrismCodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const PrismCodeBlock = ({ code, language = 'javascript', className = '' }: PrismCodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const highlightCode = async () => {
      const prism = await loadPrism();
      if (codeRef.current && prism) {
        codeRef.current.innerHTML = prism.highlight(
          code,
          prism.languages[language] || prism.languages.javascript,
          language
        );
      }
    };

    highlightCode();
  }, [code, language]);

  return (
    <pre className={`language-${language} ${className}`}>
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
};