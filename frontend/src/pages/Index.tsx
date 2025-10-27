import { useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { MessageSquare } from "lucide-react";
import { streamChat } from "@/utils/streamChat";
import { useToast } from "@/hooks/use-toast";
import { processFile, ProcessedFile } from "@/utils/fileProcessing";
import { fetchFastApiReply } from "@/utils/fastApiClient";

interface FileAttachment {
  name: string;
  type: string;
  url: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  files?: FileAttachment[];
  processedFiles?: ProcessedFile[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help you today? You can upload files like PDFs, images, or text documents and I'll analyze them for you.",
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedFastApiData, setHasFetchedFastApiData] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (text: string, files?: File[]) => {
    // Process files to extract content
    let processedFiles: ProcessedFile[] = [];
    
    if (files && files.length > 0) {
      toast({
        title: "Processing files...",
        description: "Extracting content from uploaded files.",
      });
      
      processedFiles = await Promise.all(files.map(file => processFile(file)));
    }

    // Convert processed files to display attachments
    const fileAttachments: FileAttachment[] = processedFiles.map(f => ({
      name: f.name,
      type: f.type,
      url: f.url,
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      files: fileAttachments,
      processedFiles,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    if (!hasFetchedFastApiData) {
      try {
        const fastApiReply = await fetchFastApiReply(text);
        const assistantMessage: Message = {
          id: `${Date.now()}-fastapi`,
          text: fastApiReply,
          isUser: false,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setHasFetchedFastApiData(true);
      } catch (error) {
        console.error("FastAPI error:", error);
        toast({
          title: "FastAPI Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to retrieve data from FastAPI backend.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let assistantText = "";
    const assistantId = (Date.now() + 1).toString();

    // Build the message content including file contents
    let fullMessageContent = text;

    if (processedFiles.length > 0) {
      fullMessageContent += "\n\n--- Attached Files ---\n";

      for (const file of processedFiles) {
        if (file.type.startsWith('image/')) {
          fullMessageContent += `\n[Image: ${file.name}]\n`;
          // Note: Base64 images would be sent separately in a real multimodal implementation
        } else {
          fullMessageContent += `\n--- File: ${file.name} ---\n${file.content}\n`;
        }
      }
    }

    const conversationHistory = [...messages, userMessage].map((msg) => {
      let content = msg.text;

      // Include file contents from previous messages
      if (msg.processedFiles && msg.processedFiles.length > 0) {
        content += "\n\n--- Attached Files ---\n";
        for (const file of msg.processedFiles) {
          if (!file.type.startsWith('image/')) {
            content += `\n--- File: ${file.name} ---\n${file.content}\n`;
          }
        }
      }

      return {
        role: msg.isUser ? ("user" as const) : ("assistant" as const),
        content,
      };
    });

    // Update the last entry to use the full content with files
    conversationHistory[conversationHistory.length - 1].content = fullMessageContent;

    try {
      await streamChat({
        messages: conversationHistory,
        onDelta: (chunk) => {
          assistantText += chunk;
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.id === assistantId) {
              return prev.map((m) =>
                m.id === assistantId ? { ...m, text: assistantText } : m
              );
            }
            return [...prev, { id: assistantId, text: assistantText, isUser: false }];
          });
        },
        onDone: () => {
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Chat error:", error);
          setIsLoading(false);
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">AI 助理</h1>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              files={message.files}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background">
        <div className="container mx-auto max-w-3xl p-4">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
