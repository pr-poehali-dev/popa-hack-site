import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Icon from "@/components/ui/icon";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const API_URL = "https://functions.poehali.dev/536b96e3-5d39-43b4-9a8b-3c4fd26de8d3";

interface FileItem {
  id: number;
  filename: string;
  fileSize: number;
  description: string;
  uploadedAt: string;
  username: string;
}

const Favorites = () => {
  const [favoriteFiles, setFavoriteFiles] = useState<FileItem[]>([]);
  const [username, setUsername] = useState(localStorage.getItem('username') || "");
  const { toast } = useToast();

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
    fetchFavorites();
    const interval = setInterval(fetchFavorites, 15000);
    return () => clearInterval(interval);
  }, [username]);

  const handleToggleFavorite = async (fileId: number) => {
    if (!username.trim()) return;

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
          title: "Удалено из избранного",
          description: "Файл удалён из избранного"
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
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">popa hack</h1>
            <div className="flex gap-4">
              <Link to="/">
                <Button variant="ghost">
                  <Icon name="Home" size={18} className="mr-2" />
                  Главная
                </Button>
              </Link>
              <Button variant="default">
                <Icon name="Star" size={18} className="mr-2" />
                Избранное
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h2 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Icon name="Star" size={36} />
            Избранные файлы
          </h2>
          <p className="text-muted-foreground">
            Файлы, которые вы добавили в избранное
          </p>
        </div>

        {!username.trim() ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="UserCircle" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Введите своё имя на главной странице, чтобы видеть избранные файлы
              </p>
              <Link to="/">
                <Button>
                  <Icon name="Home" size={18} className="mr-2" />
                  Перейти на главную
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : favoriteFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Icon name="Star" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                У вас пока нет избранных файлов
              </p>
              <Link to="/">
                <Button>
                  <Icon name="Home" size={18} className="mr-2" />
                  Перейти на главную
                </Button>
              </Link>
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
      </div>
    </div>
  );
};

export default Favorites;
