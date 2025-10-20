import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useState, useRef } from "react";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDownload = () => {
    if (!uploadedFile) {
      const fileContent = "Добро пожаловать в popa hack!\n\nЭто тестовый файл для демонстрации функции скачивания.\n\nСпасибо за использование!";
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'popa-hack-file.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    }

    const url = window.URL.createObjectURL(uploadedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = uploadedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-12 max-w-2xl w-full animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            popa hack
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl">
            Минималистичное решение для загрузки файлов
          </p>
        </div>

        {uploadedFile && (
          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Загружен файл:</p>
            <p className="font-medium text-lg mt-1">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(uploadedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleUploadClick}
            size="lg"
            variant="outline"
            className="text-lg px-12 py-8 rounded-2xl hover-scale transition-all duration-300"
          >
            <Icon name="Upload" size={28} className="mr-3" />
            Загрузить свой файл
          </Button>

          <Button
            onClick={handleDownload}
            size="lg"
            className="text-lg px-12 py-8 rounded-2xl hover-scale transition-all duration-300 shadow-2xl hover:shadow-primary/50"
          >
            <Icon name="Download" size={28} className="mr-3" />
            Скачать файл
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="pt-8 text-sm text-muted-foreground opacity-70">
          <p>Загрузите свой файл или скачайте тестовый</p>
        </div>
      </div>
    </div>
  );
};

export default Index;