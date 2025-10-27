import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker using Vite's URL import
const workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ProcessedFile {
  name: string;
  type: string;
  content: string;
  url: string;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return `[Error extracting text from PDF: ${file.name}]`;
  }
}

export async function readTextFile(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Error reading text file:', error);
    return `[Error reading file: ${file.name}]`;
  }
}

export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const url = URL.createObjectURL(file);
  let content = '';
  
  if (file.type === 'application/pdf') {
    content = await extractTextFromPDF(file);
  } else if (file.type.startsWith('text/') || 
             file.name.endsWith('.txt') || 
             file.name.endsWith('.md') ||
             file.name.endsWith('.json') ||
             file.name.endsWith('.csv')) {
    content = await readTextFile(file);
  } else if (file.type.startsWith('image/')) {
    // For images, we'll send base64 data
    content = await convertImageToBase64(file);
  } else {
    content = `[File ${file.name} of type ${file.type} - content extraction not supported]`;
  }
  
  return {
    name: file.name,
    type: file.type,
    content,
    url
  };
}
