
import { ReactNode, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Eye, Play, X } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isDevelopmentMode, toggleDevelopmentMode } = useAuth();
  const { isDemoMode, toggleDemoMode, demoClinic } = useDemoMode();
  
  // Add debug logging
  useEffect(() => {
    console.log("MainLayout component mounted");
    return () => console.log("MainLayout component unmounted");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 shadow-lg relative">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5" />
              <div>
                <span className="font-bold">DEMO-LÄGE AKTIVERAT</span>
                <span className="ml-2 opacity-90">
                  Du tittar på simulerad data från {demoClinic.name}
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={toggleDemoMode}
              className="text-white border-white/50 hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-1" />
              Avsluta Demo
            </Button>
          </div>
        </div>
      )}

      {/* Development Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg border">
          {/* Demo Mode Toggle */}
          {!isDemoMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleDemoMode}
              className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600"
            >
              <Play className="h-3 w-3" />
              Demo
            </Button>
          )}
          
          <Badge variant={isDevelopmentMode ? "default" : "secondary"}>
            {isDevelopmentMode ? "DEV MODE" : "PROD MODE"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleDevelopmentMode}
            className="flex items-center gap-1"
          >
            {isDevelopmentMode ? (
              <>
                <Eye className="h-3 w-3" />
                Till Prod
              </>
            ) : (
              <>
                <Code className="h-3 w-3" />
                Till Dev
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <Header />
        <main className="py-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
