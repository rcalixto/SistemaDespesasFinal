import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";
import {
  type Reembolso,
  type PrestacaoReembolso,
  type PrestacaoReembolsoItem,
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
import { FileText, Plus, Trash2, Upload, Check, X } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function PrestacaoReembolsos() {
  const [selectedReembolso, setSelectedReembolso] = useState<Reembolso | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch reembolsos que precisam de prestação de contas (status "Pago")
  const { data: reembolsos, isLoading } = useQuery<Reembolso[]>({
    queryKey: ["/api/reembolsos"],
  });

  // Filter to show only Pago reembolsos without prestação yet
  const [prestacaoExists, setPrestacaoExists] = useState<Set<number>>(new Set());

  const reembolsosPagos = reembolsos?.filter(r => {
    if (r.status !== "Pago") return false;
    if (prestacaoExists.has(r.id)) return false;
    return true;
  }) || [];

  // Check which reembolsos already have prestação
  useEffect(() => {
    const checkPrestacoes = async () => {
      if (!reembolsos) return;
      const pagos = reembolsos.filter(r => r.status === "Pago");
      const exists = new Set<number>();
      
      for (const reembolso of pagos) {
        try {
          const response = await fetch(`/api/prestacao-reembolso/by-reembolso/${reembolso.id}`, {
            credentials: "include",
          });
          // Only if fetch succeeds with 200 status, prestação exists
          if (response.ok) {
            exists.add(reembolso.id);
          }
        } catch (error) {
          // Prestação doesn't exist yet - this is expected for 404
        }
      }
      setPrestacaoExists(exists);
    };
    
    checkPrestacoes();
  }, [reembolsos]);

  const handlePrestarContas = (reembolso: Reembolso) => {
    setSelectedReembolso(reembolso);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-abert-blue dark:text-abert-blue60">
          Prestação de Contas - Reembolsos
        </h1>
        <p className="text-muted-foreground mt-2">
          Detalhe os gastos realizados para comprovação de reembolso
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando reembolsos...</p>
        </div>
      ) : reembolsosPagos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Não há reembolsos pagos pendentes de prestação de contas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reembolsosPagos.map((reembolso) => (
            <Card key={reembolso.id} data-testid={`card-reembolso-${reembolso.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">{reembolso.descricao}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reembolso.observacao || "Sem observações"}
                  </p>
                </div>
                <Badge className="bg-yellow-500 text-black">Aguardando Prestação</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor Solicitado:</p>
                    <p className="font-semibold text-lg" data-testid={`text-valor-${reembolso.id}`}>
                      {formatCurrency(Number(reembolso.valorSolicitado))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data da Despesa:</p>
                    <p className="font-medium">
                      {formatDate(reembolso.dataDespesa)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => handlePrestarContas(reembolso)}
                    className="bg-abert-blue hover-elevate active-elevate-2"
                    data-testid={`button-prestar-${reembolso.id}`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Fazer Prestação de Contas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedReembolso && (
        <PrestacaoDialog
          reembolso={selectedReembolso}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedReembolso(null);
          }}
        />
      )}
    </div>
  );
}

interface PrestacaoDialogProps {
  reembolso: Reembolso;
  isOpen: boolean;
  onClose: () => void;
}

function PrestacaoDialog({ reembolso, isOpen, onClose }: PrestacaoDialogProps) {
  const [valorComprovado, setValorComprovado] = useState("");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<Array<{
    categoria: string;
    descricao: string;
    valor: number;
    comprovante: string | null;
  }>>([]);
  const { toast } = useToast();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setValorComprovado("");
      setObservacao("");
      setItens([]);
    }
  }, [isOpen]);

  // Automatically calculate valorComprovado from itens
  useEffect(() => {
    const total = itens.reduce((sum, item) => sum + (item.valor || 0), 0);
    setValorComprovado(total.toFixed(2));
  }, [itens]);

  const addItem = () => {
    setItens([...itens, { categoria: "", descricao: "", valor: 0, comprovante: null }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof typeof itens[0], value: string | number) => {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };
    setItens(updated);
  };

  const handleUploaded = (index: number, result: UploadResult) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadData = uploadedFile.response?.body;
      
      if (uploadData && 'key' in uploadData) {
        updateItem(index, "comprovante", uploadData.key as string);
        toast({
          title: "Comprovante enviado",
          description: "Arquivo carregado com sucesso",
        });
      }
    }
  };

  const createPrestacaoMutation = useMutation({
    mutationFn: async () => {
      // Validate all required fields
      if (!valorComprovado || parseFloat(valorComprovado) <= 0) {
        throw new Error("Valor comprovado deve ser maior que zero");
      }

      if (itens.length === 0) {
        throw new Error("Adicione pelo menos um item de despesa");
      }

      // Validate each item
      for (const [index, item] of itens.entries()) {
        if (!item.categoria) {
          throw new Error(`Item ${index + 1}: selecione uma categoria`);
        }
        if (!item.valor || item.valor <= 0 || isNaN(item.valor)) {
          throw new Error(`Item ${index + 1}: informe um valor válido maior que zero`);
        }
        if (!item.comprovante) {
          throw new Error(`Item ${index + 1}: envie o comprovante`);
        }
      }

      // Prepare data
      const prestacaoData = {
        reembolsoId: reembolso.id,
        valorComprovado: parseFloat(valorComprovado),
        observacao: observacao || null,
        itens: itens.map(item => ({
          categoria: item.categoria,
          descricao: item.descricao || null,
          valor: item.valor,
          comprovante: item.comprovante,
        })),
      };

      return apiRequest("/api/prestacao-reembolso", "POST", prestacaoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reembolsos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prestacao-reembolso"] });
      toast({
        title: "Prestação criada com sucesso",
        description: "Os dados foram salvos e enviados para análise",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar prestação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-abert-blue">
            Prestação de Contas - Reembolso
          </DialogTitle>
          <DialogDescription>
            {reembolso.descricao} - {formatCurrency(Number(reembolso.valorSolicitado))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Itens de Despesa */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Itens de Despesa</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addItem}
                data-testid="button-add-item"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>

            {itens.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Clique em "Adicionar Item" para começar
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {itens.map((item, index) => (
                  <Card key={index} data-testid={`item-despesa-${index}`}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Categoria *</Label>
                          <Select
                            value={item.categoria}
                            onValueChange={(value) => updateItem(index, "categoria", value)}
                          >
                            <SelectTrigger data-testid={`select-categoria-${index}`}>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS_DESPESA.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Valor (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={item.valor || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateItem(index, "valor", isNaN(val) ? 0 : val);
                            }}
                            data-testid={`input-valor-${index}`}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Detalhes sobre esta despesa"
                          value={item.descricao}
                          onChange={(e) => updateItem(index, "descricao", e.target.value)}
                          rows={2}
                          data-testid={`textarea-descricao-${index}`}
                        />
                      </div>
                      <div>
                        <Label>Comprovante (Nota Fiscal / Recibo) *</Label>
                        <div className="mt-2">
                          <ObjectUploader
                            onUploaded={(result) => handleUploaded(index, result)}
                            allowedFileTypes={["image/*", "application/pdf"]}
                            maxFileSize={5 * 1024 * 1024}
                          />
                          {item.comprovante && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                              <Check className="h-4 w-4" />
                              Comprovante enviado
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Resumo */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor Total Comprovado:</span>
                <span className="text-xl font-bold text-abert-blue" data-testid="text-total-comprovado">
                  {formatCurrency(parseFloat(valorComprovado) || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <div>
            <Label>Observações Gerais</Label>
            <Textarea
              placeholder="Informações adicionais sobre a prestação de contas"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              data-testid="textarea-observacao"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancelar
            </Button>
            <Button
              onClick={() => createPrestacaoMutation.mutate()}
              disabled={createPrestacaoMutation.isPending}
              className="bg-abert-blue hover-elevate active-elevate-2"
              data-testid="button-submit"
            >
              {createPrestacaoMutation.isPending ? "Salvando..." : "Enviar Prestação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
