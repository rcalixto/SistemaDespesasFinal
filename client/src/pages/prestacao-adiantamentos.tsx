import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UploadResult } from "@uppy/core";
import {
  type Adiantamento,
  CATEGORIAS_DESPESA,
} from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  Trash2,
  Upload,
  Check,
  X,
  DollarSign,
  Calendar,
  Receipt,
} from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";

// Schema de validação para o formulário
const itemSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  dataDespesa: z.string().min(1, "Data da despesa é obrigatória"),
  comprovante: z.string().optional(),
});

const formSchema = z.object({
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item de despesa"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PrestacaoAdiantamentos() {
  const [selectedAdiantamento, setSelectedAdiantamento] =
    useState<Adiantamento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch adiantamentos que precisam de prestação de contas (status "Pago")
  const { data: adiantamentos, isLoading } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  // Filter to show only Pago adiantamentos without prestação yet
  const [prestacaoExists, setPrestacaoExists] = useState<Set<number>>(
    new Set()
  );

  const adiantamentosPagos =
    adiantamentos?.filter((a) => {
      if (a.status !== "Pago") return false;
      if (prestacaoExists.has(a.id)) return false;
      return true;
    }) || [];

  // Check which adiantamentos already have prestação
  useEffect(() => {
    const checkPrestacoes = async () => {
      if (!adiantamentos) return;
      const pagos = adiantamentos.filter((a) => a.status === "Pago");
      const exists = new Set<number>();

      for (const adiantamento of pagos) {
        try {
          const response = await fetch(
            `/api/prestacao-adiantamento/by-adiantamento/${adiantamento.id}`,
            {
              credentials: "include",
            }
          );
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
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Prestação de Contas
        </h1>
        <p className="text-muted-foreground">
          Informe os gastos realizados para cada adiantamento recebido
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : adiantamentosPagos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Não há adiantamentos pagos pendentes de prestação de contas
            </p>
            <p className="text-sm text-muted-foreground">
              Aguardando aprovação e pagamento dos adiantamentos solicitados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {adiantamentosPagos.map((adiantamento) => (
            <Card
              key={adiantamento.id}
              className="hover-elevate transition-all border-l-4 border-l-primary"
              data-testid={`card-adiantamento-${adiantamento.id}`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header: Title + Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">
                        {adiantamento.localViagem}
                      </h3>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">
                      Aguardando Prestação
                    </Badge>
                  </div>

                  <Separator />

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Valor Adiantado:
                      </span>
                      <span
                        className="font-medium text-foreground"
                        data-testid={`text-valor-${adiantamento.id}`}
                      >
                        {formatCurrency(Number(adiantamento.valorSolicitado))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Período:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(adiantamento.dataIda)} -{" "}
                        {formatDate(adiantamento.dataVolta)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Diretoria:</span>
                      <span className="font-medium text-foreground">
                        {adiantamento.diretoriaResponsavel}
                      </span>
                    </div>
                  </div>

                  {adiantamento.motivo && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="font-medium mb-1 text-foreground">
                          Motivo da Viagem:
                        </p>
                        <p className="text-muted-foreground">
                          {adiantamento.motivo}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Action Button */}
                  <Separator />
                  <Button
                    onClick={() => handlePrestarContas(adiantamento)}
                    className="w-full"
                    size="lg"
                    data-testid={`button-prestar-contas-${adiantamento.id}`}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Prestar Contas
                  </Button>
                </div>
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
  const [categorias, setCategorias] = useState<string[]>([
    ...CATEGORIAS_DESPESA,
  ]);
  const [customCategoryInput, setCustomCategoryInput] = useState<
    Record<number, string>
  >({});
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      observacoes: "",
      itens: [
        {
          categoria: "",
          descricao: "",
          valor: "",
          dataDespesa: "",
          comprovante: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  const createPrestacaoMutation = useMutation({
    mutationFn: async (data: {
      adiantamentoId: number;
      valorTotalGasto: number;
      valorDevolvido: number;
      valorAFaturar: number;
      observacoes?: string;
      itens: Array<{
        categoria: string;
        descricao: string;
        valor: number;
        dataDespesa?: string;
        comprovante?: string;
      }>;
    }) => {
      return await apiRequest("POST", "/api/prestacao-adiantamento", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/adiantamentos"] });
      toast({
        title: "Prestação de contas enviada!",
        description: `${data.itens?.length || 0} despesas registradas com sucesso.`,
      });
      onClose();
      form.reset();
      setCustomCategoryInput({});
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar prestação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler para obter URL de upload
  const handleGetUploadUrl = async (index: number) => {
    return async () => {
      try {
        const response = await fetch("/api/objects/upload", {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        return {
          method: "PUT" as const,
          url: data.uploadURL,
        };
      } catch (error) {
        toast({
          title: "Erro ao preparar upload",
          description: "Não foi possível obter URL de upload",
          variant: "destructive",
        });
        throw error;
      }
    };
  };

  // Handler após completar upload
  const handleUploadComplete = (index: number) => {
    return async (
      result: UploadResult<Record<string, unknown>, Record<string, unknown>>
    ) => {
      if (result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;

        try {
          // Definir ACL do comprovante
          const response = await fetch("/api/comprovantes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ comprovanteURL: uploadURL }),
          });

          const data = await response.json();

          // Atualizar item com caminho do comprovante
          form.setValue(`itens.${index}.comprovante`, data.objectPath);

          toast({
            title: "Comprovante anexado!",
            description: "O arquivo foi enviado com sucesso.",
          });
        } catch (error) {
          toast({
            title: "Erro ao processar comprovante",
            description: "O arquivo foi enviado mas houve erro ao processar",
            variant: "destructive",
          });
        }
      }
    };
  };

  const watchedItens = form.watch("itens");
  const totalGasto =
    watchedItens?.reduce((sum, item) => {
      const valor = parseFloat(String(item?.valor || "0"));
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0) || 0;

  const valorAdiantado = Number(adiantamento.valorSolicitado);
  const valorDevolvido = Math.max(0, valorAdiantado - totalGasto);
  const valorAFaturar = Math.max(0, totalGasto - valorAdiantado);

  const onSubmit = (data: FormValues) => {
    // Formatar itens para envio ao backend
    const formattedItens = data.itens.map((item) => ({
      categoria: item.categoria,
      descricao: item.descricao,
      valor: parseFloat(item.valor),
      dataDespesa: item.dataDespesa,
      comprovante: item.comprovante || undefined,
    }));

    createPrestacaoMutation.mutate({
      adiantamentoId: adiantamento.id,
      valorTotalGasto: totalGasto,
      valorDevolvido: valorDevolvido,
      valorAFaturar: valorAFaturar,
      observacoes: data.observacoes || undefined,
      itens: formattedItens,
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          form.reset();
          setCustomCategoryInput({});
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Prestação de Contas - {adiantamento.localViagem}
          </DialogTitle>
          <DialogDescription>
            Informe todas as despesas realizadas durante a viagem
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ========== SEÇÃO 1: RESUMO FINANCEIRO ========== */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Resumo Financeiro
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Valor Adiantado
                    </p>
                    <p className="text-2xl font-bold mt-1 text-primary">
                      {formatCurrency(valorAdiantado)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Gasto
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      data-testid="total-gasto"
                    >
                      {formatCurrency(totalGasto)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    {valorDevolvido > 0 ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">
                          A Devolver
                        </p>
                        <p
                          className="text-2xl font-bold mt-1 text-destructive"
                          data-testid="valor-devolver"
                        >
                          {formatCurrency(valorDevolvido)}
                        </p>
                      </>
                    ) : valorAFaturar > 0 ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">
                          A Receber
                        </p>
                        <p
                          className="text-2xl font-bold mt-1 text-green-600"
                          data-testid="valor-receber"
                        >
                          {formatCurrency(valorAFaturar)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                        <p className="text-2xl font-bold mt-1 text-blue-600">
                          Quitado
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* ========== SEÇÃO 2: ITENS DE DESPESA ========== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Itens de Despesa
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      categoria: "",
                      descricao: "",
                      valor: "",
                      dataDespesa: "",
                      comprovante: "",
                    })
                  }
                  data-testid="button-add-item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-[color:var(--abert-bg)]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-primary">
                          Item {index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Categoria */}
                        <FormField
                          control={form.control}
                          name={`itens.${index}.categoria`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">
                                Categoria *
                              </FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  if (value === "__custom__") {
                                    setCustomCategoryInput({
                                      ...customCategoryInput,
                                      [index]: "",
                                    });
                                  } else {
                                    field.onChange(value);
                                    const newInput = { ...customCategoryInput };
                                    delete newInput[index];
                                    setCustomCategoryInput(newInput);
                                  }
                                }}
                                value={
                                  customCategoryInput[index] !== undefined
                                    ? "__custom__"
                                    : field.value
                                }
                              >
                                <FormControl>
                                  <SelectTrigger
                                    data-testid={`select-categoria-${index}`}
                                  >
                                    <SelectValue placeholder="Selecione a categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categorias.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="__custom__">
                                    Outro (digitar)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {customCategoryInput[index] !== undefined && (
                                <div className="flex gap-2 mt-2">
                                  <Input
                                    placeholder="Digite a categoria"
                                    value={customCategoryInput[index]}
                                    onChange={(e) => {
                                      setCustomCategoryInput({
                                        ...customCategoryInput,
                                        [index]: e.target.value,
                                      });
                                    }}
                                    data-testid={`input-custom-categoria-${index}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newCategory =
                                        customCategoryInput[index].trim();
                                      if (newCategory) {
                                        if (!categorias.includes(newCategory)) {
                                          setCategorias([
                                            ...categorias,
                                            newCategory,
                                          ]);
                                        }
                                        field.onChange(newCategory);
                                        const newInput = {
                                          ...customCategoryInput,
                                        };
                                        delete newInput[index];
                                        setCustomCategoryInput(newInput);
                                      }
                                    }}
                                    data-testid={`button-add-custom-categoria-${index}`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newInput = { ...customCategoryInput };
                                      delete newInput[index];
                                      setCustomCategoryInput(newInput);
                                    }}
                                    data-testid={`button-cancel-custom-categoria-${index}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Valor */}
                        <FormField
                          control={form.control}
                          name={`itens.${index}.valor`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-primary">
                                Valor *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      /^\d*\.?\d*$/.test(value)
                                    ) {
                                      field.onChange(value);
                                    }
                                  }}
                                  data-testid={`input-valor-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Descrição */}
                      <FormField
                        control={form.control}
                        name={`itens.${index}.descricao`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary">
                              Descrição *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Descreva o item da despesa"
                                {...field}
                                data-testid={`input-descricao-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Data da Despesa */}
                      <FormField
                        control={form.control}
                        name={`itens.${index}.dataDespesa`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary">
                              Data da Despesa *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                data-testid={`input-data-despesa-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Upload Zone - Comprovante */}
                      <div className="space-y-3">
                        <FormLabel>Comprovante (Nota Fiscal/Recibo)</FormLabel>

                        {form.watch(`itens.${index}.comprovante`) ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm p-3 rounded border bg-muted/30">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="flex-1">
                                Comprovante anexado com sucesso
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  form.setValue(
                                    `itens.${index}.comprovante`,
                                    ""
                                  )
                                }
                                data-testid={`button-remove-comprovante-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs font-medium mb-1">
                              Adicionar Comprovante
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Arraste arquivos ou clique para selecionar
                            </p>
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10485760}
                              onGetUploadParameters={handleGetUploadUrl(index)}
                              onComplete={handleUploadComplete(index)}
                              buttonVariant="outline"
                              buttonSize="sm"
                              data-testid={`upload-comprovante-${index}`}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar Arquivo
                            </ObjectUploader>
                            <p className="text-xs text-muted-foreground mt-2">
                              Aceita imagens e PDF (max 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {form.formState.errors.itens && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.itens.message}
                </p>
              )}
            </div>

            <Separator />

            {/* ========== SEÇÃO 3: OBSERVAÇÕES ========== */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações Gerais
              </h3>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre as despesas realizadas (opcional)"
                        rows={3}
                        {...field}
                        data-testid="textarea-observacoes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createPrestacaoMutation.isPending}
              data-testid="button-submit"
            >
              {createPrestacaoMutation.isPending
                ? "Enviando..."
                : "Enviar Prestação"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
