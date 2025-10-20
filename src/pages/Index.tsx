import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const Index = () => {
  const handleDownload = () => {
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

        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            size="lg"
            className="text-lg px-12 py-8 rounded-2xl hover-scale transition-all duration-300 shadow-2xl hover:shadow-primary/50"
          >
            <Icon name="Download" size={28} className="mr-3" />
            Скачать файл
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground opacity-70">
          <p>Нажмите кнопку для загрузки файла</p>
        </div>
      </div>
    </div>
  );
};

export default Index;