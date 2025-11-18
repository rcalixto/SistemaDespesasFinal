import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Plane,
  Hotel,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Adiantamento, Reembolso, PassagemAerea, Hospedagem } from "@shared/schema";

export default function PendenciasDiretoria() {
  const { toast } = useToast();

  const { data: adiantamentos = [], isLoading: loadingAdiant } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  const { data: reembolsos = [], isLoading: loadingReemb } = useQuery<Reembolso[]>({
    queryKey: ["/api/reembolsos"],
  });

  const { data: passagens = [], isLoading: loadingPass } = useQuery<PassagemAerea[]>({
    queryKey: ["/api/passagens"],
  });

  const { data: hospedagens = [], isLoading: loadingHosp } = useQuery<Hospedagem[]>({
    queryKey: ["/api/hospedagens"],
  });

  const pendingAdiantamentos = adiantamentos.filter((a) => a.status === "Solicitado");
  const pendingReembolsos = reembolsos.filter((r) => r.status === "Solicitado");
  const pendingPassagens = passagens.filter((p) => p.status === "Solicitado");
  const pendingHospedagens = hospedagens.filter((h) => h.status === "Solicitado");

  const totalPending =
    pendingAdiantamentos.length +
    pendingReembolsos.length +
    pendingPassagens.length +
    pendingHospedagens.length;

  const approveMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      return await apiRequest("POST", `/api/${type}/${id}/approve-diretoria`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.type}`] });
      toast({
        title: "Aprovado",
        description: "Solicitação aprovada pela diretoria com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      return await apiRequest("POST", `/api/${type}/${id}/reject`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.type}`] });
      toast({
        title: "Rejeitado",
        description: "Solicitação rejeitada.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Pendências Diretoria
        </h1>
        <p className="text-muted-foreground">
          Aprove ou rejeite solicitações aguardando aprovação da diretoria
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">{totalPending}</p>
              <Clock className="w-8 h-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adiantamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {pendingAdiantamentos.length}
              </p>
              <DollarSign className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reembolsos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {pendingReembolsos.length}
              </p>
              <FileText className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Passagens & Hospedagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {pendingPassagens.length + pendingHospedagens.length}
              </p>
              <Plane className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="adiantamentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="adiantamentos" data-testid="tab-adiantamentos">
            Adiantamentos
            {pendingAdiantamentos.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pendingAdiantamentos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reembolsos" data-testid="tab-reembolsos">
            Reembolsos
            {pendingReembolsos.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pendingReembolsos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="passagens" data-testid="tab-passagens">
            Passagens
            {pendingPassagens.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pendingPassagens.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hospedagens" data-testid="tab-hospedagens">
            Hospedagens
            {pendingHospedagens.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pendingHospedagens.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adiantamentos">
          {loadingAdiant ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pendingAdiantamentos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum adiantamento pendente de aprovação
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAdiantamentos.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-warning" data-testid={`pending-adiantamento-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {item.localViagem}
                        </h3>
                        <p className="text-muted-foreground mb-3">{item.motivo}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Período:</span>{" "}
                            {formatDate(item.dataIda)} até {formatDate(item.dataVolta)}
                          </div>
                          <div>
                            <span className="font-medium">Diretoria:</span>{" "}
                            {item.diretoriaResponsavel}
                          </div>
                          <div>
                            <span className="font-medium">Valor:</span>{" "}
                            {formatCurrency(item.valorSolicitado)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              approveMutation.mutate({ type: "adiantamentos", id: item.id })
                            }
                            disabled={approveMutation.isPending}
                            className="gap-2"
                            data-testid={`approve-adiantamento-${item.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              rejectMutation.mutate({ type: "adiantamentos", id: item.id })
                            }
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                            data-testid={`reject-adiantamento-${item.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      <StatusBadge status={item.status || "Solicitado"} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reembolsos">
          {loadingReemb ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pendingReembolsos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum reembolso pendente de aprovação
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReembolsos.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-warning" data-testid={`pending-reembolso-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Reembolso #{item.id}
                        </h3>
                        <p className="text-muted-foreground mb-3">{item.motivo}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Valor:</span>{" "}
                            {formatCurrency(item.valorTotalSolicitado)}
                          </div>
                          {item.centroCusto && (
                            <div>
                              <span className="font-medium">Centro de Custo:</span>{" "}
                              {item.centroCusto}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              approveMutation.mutate({ type: "reembolsos", id: item.id })
                            }
                            disabled={approveMutation.isPending}
                            className="gap-2"
                            data-testid={`approve-reembolso-${item.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              rejectMutation.mutate({ type: "reembolsos", id: item.id })
                            }
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                            data-testid={`reject-reembolso-${item.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      <StatusBadge status={item.status || "Solicitado"} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="passagens">
          {loadingPass ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pendingPassagens.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma passagem pendente de aprovação
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPassagens.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-warning" data-testid={`pending-passagem-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {item.origem} → {item.destino}
                        </h3>
                        <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Ida:</span> {formatDate(item.dataIda)}
                          </div>
                          {item.dataVolta && (
                            <div>
                              <span className="font-medium">Volta:</span>{" "}
                              {formatDate(item.dataVolta)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              approveMutation.mutate({ type: "passagens", id: item.id })
                            }
                            disabled={approveMutation.isPending}
                            className="gap-2"
                            data-testid={`approve-passagem-${item.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              rejectMutation.mutate({ type: "passagens", id: item.id })
                            }
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                            data-testid={`reject-passagem-${item.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      <StatusBadge status={item.status || "Solicitado"} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hospedagens">
          {loadingHosp ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pendingHospedagens.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma hospedagem pendente de aprovação
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingHospedagens.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-warning" data-testid={`pending-hospedagem-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {item.cidade}{item.estado && `, ${item.estado}`}
                        </h3>
                        <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Check-in:</span>{" "}
                            {formatDate(item.dataCheckin)}
                          </div>
                          <div>
                            <span className="font-medium">Check-out:</span>{" "}
                            {formatDate(item.dataCheckout)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              approveMutation.mutate({ type: "hospedagens", id: item.id })
                            }
                            disabled={approveMutation.isPending}
                            className="gap-2"
                            data-testid={`approve-hospedagem-${item.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              rejectMutation.mutate({ type: "hospedagens", id: item.id })
                            }
                            disabled={rejectMutation.isPending}
                            className="gap-2"
                            data-testid={`reject-hospedagem-${item.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                      <StatusBadge status={item.status || "Solicitado"} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
