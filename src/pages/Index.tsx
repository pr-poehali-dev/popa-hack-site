import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const API_URL = "https://functions.poehali.dev/536b96e3-5d39-43b4-9a8b-3c4fd26de8d3";

interface FileItem {
  id: number;
  filename: string;
  fileSize: number;
  description: string;
  uploadedAt: string;
  username: string;
}

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Ошибка загрузки файлов:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!username.trim()) {
      toast({
        title: "Введите имя",
        description: "Пожалуйста, введите ваше имя перед загрузкой файла",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64File = base64Data.split(',')[1];

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            filename: file.name,
            fileData: base64File,
            description: description.trim()
          })
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Файл загружен!",
            description: "Ваш файл появится в ленте"
          });
          setDescription("");
          await fetchFiles();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`${API_URL}?id=${fileId}`);
      const data = await response.json();
      
      const fileData = atob(data.fileData);
      const bytes = new Uint8Array(fileData.length);
      for (let i = 0; i < fileData.length; i++) {
        bytes[i] = fileData.charCodeAt(i);
      }
      
      const blob = new Blob([bytes]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Файл скачан!",
        description: filename
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать файл",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            popa hack
          </h1>
          <p className="text-muted-foreground text-lg">
            Обменивайтесь файлами с другими пользователями
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Upload" size={24} />
              Загрузить файл
            </CardTitle>
            <CardDescription>
              Поделитесь своим файлом с сообществом
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ваше имя</label>
              <Input
                placeholder="Введите ваше имя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Описание файла (опционально)</label>
              <Textarea
                placeholder="Расскажите о вашем файле..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Icon name="Upload" size={20} className="mr-2" />
                  Выбрать и загрузить файл
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Icon name="FileStack" size={28} />
              Лента файлов
            </h2>
            <p className="text-sm text-muted-foreground">
              Обновляется каждые 15 секунд
            </p>
          </div>

          {files.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Пока нет загруженных файлов. Будьте первым!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <Card key={file.id} className="hover-scale transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <Icon name="File" size={20} className="mt-1 flex-shrink-0" />
                      <span className="break-all">{file.filename}</span>
                    </CardTitle>
                    <CardDescription>
                      от {file.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {file.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                    <Button
                      onClick={() => handleDownload(file.id, file.filename)}
                      className="w-full"
                      variant="default"
                    >
                      <Icon name="Download" size={18} className="mr-2" />
                      Скачать
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;