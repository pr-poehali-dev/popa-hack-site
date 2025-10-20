import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [favoriteFiles, setFavoriteFiles] = useState<FileItem[]>([]);
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
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

  const fetchFavorites = async () => {
    if (!username.trim()) return;
    try {
      const response = await fetch(`${API_URL}?action=favorites&username=${encodeURIComponent(username)}`);
      const data = await response.json();
      setFavoriteFiles(data.files || []);
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (username.trim() && currentTab === 'favorites') {
      fetchFavorites();
    }
  }, [currentTab, username]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Выберите файл",
        description: "Пожалуйста, выберите файл для загрузки",
        variant: "destructive"
      });
      return;
    }

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
            filename: selectedFile.name,
            fileData: base64File,
            description: description.trim()
          })
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Файл загружен!",
            description: "Ваш файл появился в ленте"
          });
          setDescription("");
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          await fetchFiles();
        }
      };
      reader.readAsDataURL(selectedFile);
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

  const handleToggleFavorite = async (fileId: number) => {
    if (!username.trim()) {
      toast({
        title: "Введите имя",
        description: "Войдите в систему, чтобы добавлять в избранное",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'favorite',
          fileId: fileId,
          username: username.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: result.isFavorited ? "Добавлено в избранное" : "Удалено из избранного",
          description: result.isFavorited ? "Файл сохранён в избранном" : "Файл удалён из избранного"
        });
        await fetchFavorites();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!username.trim()) {
      toast({
        title: "Ошибка",
        description: "Войдите в систему",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}?id=${fileId}&username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Файл удалён",
          description: "Ваш файл успешно удалён"
        });
        await fetchFiles();
        await fetchFavorites();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить файл",
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
            
            {selectedFile && (
              <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-3">
                  <Icon name="File" size={24} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <Icon name="X" size={18} />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Icon name="FolderOpen" size={20} className="mr-2" />
                Выбрать файл
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="flex-1"
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
                    Загрузить
                  </>
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Icon name="FileStack" size={18} />
                Все файлы
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Icon name="Star" size={18} />
                Избранное
              </TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              Обновляется каждые 15 секунд
            </p>
          </div>

          <TabsContent value="all">
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
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg flex items-start gap-2 flex-1">
                          <Icon name="File" size={20} className="mt-1 flex-shrink-0" />
                          <span className="break-all">{file.filename}</span>
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Icon name="MoreVertical" size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleFavorite(file.id)}>
                              <Icon name="Star" size={16} className="mr-2" />
                              Добавить в избранное
                            </DropdownMenuItem>
                            {file.username === username && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-destructive"
                              >
                                <Icon name="Trash2" size={16} className="mr-2" />
                                Удалить файл
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
          </TabsContent>

          <TabsContent value="favorites">
            {!username.trim() ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="UserCircle" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Введите своё имя выше, чтобы видеть избранные файлы
                  </p>
                </CardContent>
              </Card>
            ) : favoriteFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Star" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    У вас пока нет избранных файлов
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoriteFiles.map((file) => (
                  <Card key={file.id} className="hover-scale transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg flex items-start gap-2 flex-1">
                          <Icon name="File" size={20} className="mt-1 flex-shrink-0" />
                          <span className="break-all">{file.filename}</span>
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Icon name="MoreVertical" size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleFavorite(file.id)}>
                              <Icon name="StarOff" size={16} className="mr-2" />
                              Удалить из избранного
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;