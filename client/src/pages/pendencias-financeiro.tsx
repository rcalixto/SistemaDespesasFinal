import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Clock,
  Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Adiantamento, Reembolso } from "@shared/schema";
import { useState } from "react";

export default function PendenciasFinanceiro() {
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: number } | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState("");

  const { data: adiantamentos = [], isLoading: loadingAdiant } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  const { data: reembolsos = [], isLoading: loadingReemb } = useQuery<Reembolso[]>({
    queryKey: ["/api/reembolsos"],
  });

  const pendingAdiantamentos = adiantamentos.filter(
    (a) => a.status === "AprovadoDiretoria"
  );
  const pendingReembolsos = reembolsos.filter(
    (r) => r.status === "AprovadoDiretoria"
  );

  const totalPending = pendingAdiantamentos.length + pendingReembolsos.length;

  const approveMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      return await apiRequest("POST", `/api/${type}/${id}/approve-financeiro`, {
        formaPagamento,
        dataPagamento,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.type}`] });
      toast({
        title: "Aprovado e Pago",
        description: "Solicitação aprovada pelo financeiro e marcada como paga!",
      });
      setPaymentDialogOpen(false);
      setFormaPagamento("");
      setDataPagamento("");
      setSelectedItem(null);
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
        description: "Solicitação rejeitada pelo financeiro.",
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

  const openPaymentDialog = (type: string, id: number) => {
    setSelectedItem({ type, id });
    setDataPagamento(new Date().toISOString().split("T")[0]);
    setPaymentDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedItem && formaPagamento && dataPagamento) {
      approveMutation.mutate(selectedItem);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Pendências Financeiro
        </h1>
        <p className="text-muted-foreground">
          Aprove pagamentos e gerencie aprovações financeiras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="forma-pagamento">Forma de Pagamento *</Label>
              <Input
                id="forma-pagamento"
                placeholder="Ex: Transferência Bancária"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                data-testid="input-forma-pagamento"
              />
            </div>
            <div>
              <Label htmlFor="data-pagamento">Data do Pagamento *</Label>
              <Input
                id="data-pagamento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                data-testid="input-data-pagamento"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleApprove}
              disabled={!formaPagamento || !dataPagamento || approveMutation.isPending}
              data-testid="confirm-approve"
            >
              {approveMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  Nenhum adiantamento aguardando aprovação financeira
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAdiantamentos.map((item) => (
                <Card
                  key={item.id}
                  className="border-l-4 border-l-primary"
                  data-testid={`pending-adiantamento-${item.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {item.localViagem}
                        </h3>
                        <p className="text-muted-foreground mb-3">{item.motivo}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(item.dataIda)} até {formatDate(item.dataVolta)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Diretoria:</span>{" "}
                            {item.diretoriaResponsavel}
                          </div>
                          <div className="font-medium text-primary">
                            {formatCurrency(item.valorSolicitado)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog("adiantamentos", item.id)}
                            className="gap-2"
                            data-testid={`approve-adiantamento-${item.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar e Pagar
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
                      <StatusBadge status={item.status || "AprovadoDiretoria"} />
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
                  Nenhum reembolso aguardando aprovação financeira
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReembolsos.map((item) => (
                <Card
                  key={item.id}
                  className="border-l-4 border-l-accent"
                  data-testid={`pending-reembolso-${item.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Reembolso #{item.id}
                        </h3>
                        <p className="text-muted-foreground mb-3">{item.motivo}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">Solicitado em:</span>{" "}
                            {formatDate(item.dataSolicitacao!)}
                          </div>
                          {item.centroCusto && (
                            <div>
                              <span className="font-medium">Centro de Custo:</span>{" "}
                              {item.centroCusto}
                            </div>
                          )}
                          <div className="font-medium text-accent-foreground">
                            {formatCurrency(item.valorTotalSolicitado)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog("reembolsos", item.id)}
                            className="gap-2"
                            data-testid={`approve-reembolso-${item.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprovar e Pagar
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
                      <StatusBadge status={item.status || "AprovadoDiretoria"} />
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
