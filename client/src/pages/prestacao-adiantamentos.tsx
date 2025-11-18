import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  type Adiantamento,
  type PrestacaoAdiantamento,
  type PrestacaoAdiantamentoItem,
  CATEGORIAS_DESPESA,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, Trash2, Upload } from "lucide-react";

export default function PrestacaoAdiantamentos() {
  const [selectedAdiantamento, setSelectedAdiantamento] = useState<Adiantamento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch adiantamentos que precisam de prestação de contas (status "Pago")
  const { data: adiantamentos, isLoading } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  // Filter to show only Pago adiantamentos without prestação yet
  const [prestacaoExists, setPrestacaoExists] = useState<Set<number>>(new Set());

  const adiantamentosPagos = adiantamentos?.filter(a => {
    if (a.status !== "Pago") return false;
    if (prestacaoExists.has(a.id)) return false;
    return true;
  }) || [];

  // Check which adiantamentos already have prestação
  useEffect(() => {
    const checkPrestacoes = async () => {
      if (!adiantamentos) return;
      const pagos = adiantamentos.filter(a => a.status === "Pago");
      const exists = new Set<number>();
      
      for (const adiantamento of pagos) {
        try {
          const response = await fetch(`/api/prestacao-adiantamento/by-adiantamento/${adiantamento.id}`, {
            credentials: "include",
          });
          // Only if fetch succeeds with 200 status, prestação exists
          if (response.ok) {
            exists.add(adiantamento.id);
          }
        } catch (error) {
          // Prestação doesn't exist yet - this is expected for 404
        }
      }
      setPrestacaoExists(exists);
    };
    
    checkPrestacoes();
  }, [adiantamentos]);

  const handlePrestarContas = (adiantamento: Adiantamento) => {
    setSelectedAdiantamento(adiantamento);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-abert-blue dark:text-abert-blue60">
          Prestação de Contas - Adiantamentos
        </h1>
        <p className="text-muted-foreground mt-2">
          Informe os gastos realizados para cada adiantamento recebido
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando adiantamentos...</p>
        </div>
      ) : adiantamentosPagos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Não há adiantamentos pagos pendentes de prestação de contas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {adiantamentosPagos.map((adiantamento) => (
            <Card key={adiantamento.id} data-testid={`card-adiantamento-${adiantamento.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">{adiantamento.localViagem}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {adiantamento.motivo}
                  </p>
                </div>
                <Badge className="bg-yellow-500 text-black">Aguardando Prestação</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Adiantado:</p>
                    <p className="font-semibold text-lg" data-testid={`text-valor-${adiantamento.id}`}>
                      {formatCurrency(Number(adiantamento.valorSolicitado))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Período da Viagem:</p>
                    <p className="font-medium">
                      {formatDate(adiantamento.dataIda)} a {formatDate(adiantamento.dataVolta)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Diretoria:</p>
                    <p className="font-medium">{adiantamento.diretoriaResponsavel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data Pagamento:</p>
                    <p className="font-medium">
                      {adiantamento.dataPagamento ? formatDate(adiantamento.dataPagamento) : "N/A"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handlePrestarContas(adiantamento)}
                  className="w-full"
                  data-testid={`button-prestar-contas-${adiantamento.id}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Prestar Contas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedAdiantamento && (
        <PrestacaoContasDialog
          adiantamento={selectedAdiantamento}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedAdiantamento(null);
          }}
        />
      )}
    </div>
  );
}

// Dialog component for creating prestação de contas
function PrestacaoContasDialog({
  adiantamento,
  isOpen,
  onClose,
}: {
  adiantamento: Adiantamento;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [itens, setItens] = useState<Array<{ categoria: string; descricao: string; valor: string; comprovante?: File }>>([]);
  const [observacoes, setObservacoes] = useState("");
  const { toast } = useToast();

  const createPrestacaoMutation = useMutation({
    mutationFn: async (data: {
      adiantamentoId: number;
      valorTotalGasto: number;
      valorDevolvido: number;
      valorAFaturar: number;
      observacoes?: string;
    }) => {
      return await apiRequest("POST", "/api/prestacao-adiantamento", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adiantamentos"] });
      toast({
        title: "Prestação de contas enviada!",
        description: "Sua prestação foi registrada e está aguardando aprovação.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar prestação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setItens([...itens, { categoria: CATEGORIAS_DESPESA[0], descricao: "", valor: "0" }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const totalGasto = itens.reduce((sum, item) => {
    const valor = parseFloat(item.valor) || 0;
    return sum + valor;
  }, 0);

  const valorAdiantado = Number(adiantamento.valorSolicitado);
  const valorDevolvido = Math.max(0, valorAdiantado - totalGasto);
  const valorAFaturar = Math.max(0, totalGasto - valorAdiantado);

  const handleSubmit = () => {
    if (itens.length === 0) {
      toast({
        title: "Adicione despesas",
        description: "É necessário adicionar pelo menos uma despesa.",
        variant: "destructive",
      });
      return;
    }

    createPrestacaoMutation.mutate({
      adiantamentoId: adiantamento.id,
      valorTotalGasto: totalGasto,
      valorDevolvido: valorDevolvido,
      valorAFaturar: valorAFaturar,
      observacoes: observacoes || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prestação de Contas - {adiantamento.localViagem}</DialogTitle>
          <DialogDescription>
            Informe todas as despesas realizadas durante a viagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm text-muted-foreground">Valor Adiantado</p>
              <p className="text-lg font-bold text-abert-blue dark:text-abert-blue60">
                {formatCurrency(valorAdiantado)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-lg font-bold" data-testid="text-total-gasto">
                {formatCurrency(totalGasto)}
              </p>
            </div>
            <div>
              {valorDevolvido > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">A Devolver</p>
                  <p className="text-lg font-bold text-red-600" data-testid="text-valor-devolver">
                    {formatCurrency(valorDevolvido)}
                  </p>
                </>
              ) : valorAFaturar > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-lg font-bold text-green-600" data-testid="text-valor-receber">
                    {formatCurrency(valorAFaturar)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-blue-600">Quitado</p>
                </>
              )}
            </div>
          </div>

          {/* Itens de Despesa Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Despesas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                data-testid="button-add-despesa"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Despesa
              </Button>
            </div>

            {itens.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                Clique em "Adicionar Despesa" para começar
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[150px]">Valor (R$)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={index} data-testid={`row-despesa-${index}`}>
                      <TableCell>
                        <Select
                          value={item.categoria}
                          onValueChange={(value) => updateItem(index, "categoria", value)}
                        >
                          <SelectTrigger data-testid={`select-categoria-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIAS_DESPESA.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Descrição opcional"
                          value={item.descricao}
                          onChange={(e) => updateItem(index, "descricao", e.target.value)}
                          data-testid={`input-descricao-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor}
                          onChange={(e) => updateItem(index, "valor", e.target.value)}
                          data-testid={`input-valor-${index}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais sobre as despesas"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              data-testid="textarea-observacoes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-cancelar"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPrestacaoMutation.isPending}
              data-testid="button-enviar-prestacao"
            >
              {createPrestacaoMutation.isPending ? "Enviando..." : "Enviar Prestação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
