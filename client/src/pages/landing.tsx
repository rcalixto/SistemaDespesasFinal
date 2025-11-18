import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  FileText,
  Plane,
  Hotel,
  BarChart3,
  CheckCircle,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Sistema de Gestão de Despesas
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Controle completo de adiantamentos, reembolsos, viagens e hospedagens
            para a ABERT
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = "/api/login")}
            className="px-8 py-6 text-lg"
            data-testid="login-button"
          >
            Fazer Login
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Adiantamentos</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Solicite e gerencie adiantamentos para viagens corporativas com
                workflow de aprovação automatizado
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Reembolsos</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Registre despesas e solicite reembolsos com anexo de comprovantes
                e notas fiscais
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Passagens Aéreas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Solicite passagens aéreas com aprovação da diretoria e controle
                financeiro
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Hotel className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Hospedagens</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gerencie reservas de hospedagens com controle de diárias e
                valores totais
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Dashboards</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Visualize relatórios gerenciais com gráficos e estatísticas por
                diretoria e centro de custo
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold text-lg">Workflows</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Aprovações automáticas em duas etapas: diretoria e financeiro,
                com rastreamento em tempo real
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ABERT. Sistema de Gestão de Despesas
            Corporativas.
          </p>
        </div>
      </div>
    </div>
  );
}
