import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign,
  FileText,
  Plane,
  Hotel,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import type { User } from "@shared/schema";

export default function Home() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getUserInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.firstName || "Colaborador"}!
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas despesas e solicitações
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/api/logout")}
            data-testid="logout-button"
          >
            Sair
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adiantamentos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  R$ 0,00 total
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reembolsos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  R$ 0,00 total
                </p>
              </div>
              <FileText className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  solicitações
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  processos
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            asChild
            className="h-auto py-6 flex-col space-y-2"
            variant="outline"
          >
            <Link href="/adiantamentos" data-testid="quick-adiantamento">
              <DollarSign className="w-6 h-6" />
              <span>Novo Adiantamento</span>
            </Link>
          </Button>
          <Button
            asChild
            className="h-auto py-6 flex-col space-y-2"
            variant="outline"
          >
            <Link href="/reembolsos" data-testid="quick-reembolso">
              <FileText className="w-6 h-6" />
              <span>Novo Reembolso</span>
            </Link>
          </Button>
          <Button
            asChild
            className="h-auto py-6 flex-col space-y-2"
            variant="outline"
          >
            <Link href="/passagens" data-testid="quick-passagem">
              <Plane className="w-6 h-6" />
              <span>Solicitar Passagem</span>
            </Link>
          </Button>
          <Button
            asChild
            className="h-auto py-6 flex-col space-y-2"
            variant="outline"
          >
            <Link href="/hospedagens" data-testid="quick-hospedagem">
              <Hotel className="w-6 h-6" />
              <span>Solicitar Hospedagem</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity - Empty State */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Atividades Recentes
        </h2>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma atividade recente
            </p>
            <p className="text-sm text-muted-foreground">
              Suas solicitações e aprovações aparecerão aqui
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
