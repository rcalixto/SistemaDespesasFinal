import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, FileText, DollarSign, Trash2, Receipt, Upload, Check, X, Pencil, File } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ComboboxCreatable } from "@/components/ComboboxCreatable";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Reembolso } from "@shared/schema";
import { z } from "zod";

const CATEGORIAS_PADRAO = [
  "Transporte",
  "Alimentação",
  "Hospedagem",
  "Material de Escritório",
  "Serviços de Terceiros",
  "Comunicação",
  "Treinamento",
  "Outros",
] as const;

const itemSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.string().min(1, "Valor é obrigatório"),
  dataDespesa: z.string().min(1, "Data da despesa é obrigatória"),
  comprovante: z.string().optional(),
});

const formSchema = z.object({
  motivo: z.string().min(1, "Motivo é obrigatório"),
  centroCusto: z.string().min(1, "Centro de custo é obrigatório"),
  justificativa: z.string().min(10, "Justificativa deve ter pelo menos 10 caracteres"),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item de despesa"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Reembolsos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Reembolso | null>(null);
  const [categorias, setCategorias] = useState<string[]>([...CATEGORIAS_PADRAO]);
  const [customCategoryInput, setCustomCategoryInput] = useState<Record<number, string>>({});
  const [comprovantes, setComprovantes] = useState<Record<number, File[]>>({});
  const { toast } = useToast();

  const { data: reembolsos = [], isLoading } = useQuery<Reembolso[]>({
    queryKey: ["/api/reembolsos"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motivo: "",
      centroCusto: "",
      justificativa: "",
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

  const handleFileChange = (index: number, files: FileList | null) => {
    if (files && files.length > 0) {
      setComprovantes(prev => ({
        ...prev,
        [index]: Array.from(files)
      }));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Calculate total from items
      const valorTotalSolicitado = data.itens.reduce(
        (sum, item) => sum + Number(item.valor),
        0
      );

      // Create FormData
      const formData = new FormData();
      
      // Add text fields
      formData.append('motivo', data.motivo);
      formData.append('centroCusto', data.centroCusto);
      formData.append('justificativa', data.justificativa);
      if (data.observacoes) {
        formData.append('observacoes', data.observacoes);
      }
      formData.append('valorTotalSolicitado', String(valorTotalSolicitado));
      
      // Add items as JSON
      const itensData = data.itens.map((item, idx) => ({
        categoria: item.categoria,
        descricao: item.descricao,
        valor: Number(item.valor),
        dataDespesa: String(item.dataDespesa),
        comprovante: item.comprovante || "",
        hasNewFile: !!comprovantes[idx]
      }));
      formData.append('itens', JSON.stringify(itensData));
      
      // Add all files
      Object.entries(comprovantes).forEach(([index, files]) => {
        files.forEach(file => {
          formData.append(`comprovante_${index}`, file);
        });
      });

      const url = editingId 
        ? `/api/reembolsos/${editingId}`
        : '/api/reembolsos';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar reembolso');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reembolsos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: editingId
          ? "Reembolso atualizado com sucesso!"
          : "Reembolso criado com sucesso!",
      });
      setDialogOpen(false);
      setEditingId(null);
      setComprovantes({});
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reembolsos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir reembolso');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reembolsos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Reembolso excluído com sucesso!",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

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

  const handleEdit = (item: Reembolso) => {
    setEditingId(item.id);
    // Reset form with reembolso data - need to fetch items separately
    form.reset({
      motivo: item.motivo,
      centroCusto: item.centroCusto,
      justificativa: item.justificativa,
      observacoes: item.observacoes || "",
      itens: item.itens && item.itens.length > 0 ? item.itens.map(i => ({
        categoria: i.categoria,
        descricao: i.descricao,
        valor: String(i.valor),
        dataDespesa: i.dataDespesa ? new Date(i.dataDespesa).toISOString().split('T')[0] : "",
        comprovante: i.comprovante || "",
      })) : [{
        categoria: "",
        descricao: "",
        valor: "",
        dataDespesa: "",
        comprovante: "",
      }],
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: Reembolso) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const canEdit = (item: Reembolso) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  const canDelete = (item: Reembolso) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  const watchedItens = form.watch("itens");
  const totalCalculado = watchedItens?.reduce(
    (sum, item) => {
      const valor = parseFloat(String(item?.valor || "0"));
      return sum + (isNaN(valor) ? 0 : valor);
    },
    0
  ) || 0;

  const summary = {
    total: reembolsos.length,
    totalValue: reembolsos.reduce(
      (acc, r) => acc + Number(r.valorTotalSolicitado || 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#004650" }}>
            Reembolsos
          </h1>
          <p style={{ color: "#4A5458" }}>
            Solicite reembolsos de despesas corporativas com comprovantes
          </p>
        </div>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setComprovantes({});
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              data-testid="button-new-reembolso"
              style={{ backgroundColor: "#FFC828", color: "#004650" }}
            >
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: "#004650" }}>
                {editingId ? "Editar Reembolso" : "Nova Solicitação de Reembolso"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "#004650" }}>Motivo *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Hospedagem em viagem a trabalho"
                            {...field}
                            data-testid="input-motivo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="centroCusto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{ color: "#004650" }}>
                          Centro de Custo *
                        </FormLabel>
                        <FormControl>
                          <ComboboxCreatable
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione ou crie um centro de custo"
                            emptyText="Nenhum centro de custo encontrado"
                            createText="Criar centro de custo"
                            searchText="Buscar centro de custo"
                            apiEndpoint="/api/centros-custo"
                            queryKey="/api/centros-custo"
                            label="Centro de custo"
                            testId="select-centro-custo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="justificativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#004650" }}>
                        Justificativa *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a justificativa para o reembolso..."
                          rows={3}
                          {...field}
                          data-testid="textarea-justificativa"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#004650" }}>
                        Observações
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais (opcional)"
                          rows={2}
                          {...field}
                          data-testid="textarea-observacoes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: "#004650" }}>
                      Itens de Despesa *
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
                      <Card
                        key={field.id}
                        className="p-4"
                        style={{ backgroundColor: "#F5F8FC" }}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium" style={{ color: "#004650" }}>
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
                            <FormField
                              control={form.control}
                              name={`itens.${index}.categoria`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ color: "#004650" }}>
                                    Categoria *
                                  </FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      if (value === "__custom__") {
                                        setCustomCategoryInput({ ...customCategoryInput, [index]: "" });
                                      } else {
                                        field.onChange(value);
                                        const newInput = { ...customCategoryInput };
                                        delete newInput[index];
                                        setCustomCategoryInput(newInput);
                                      }
                                    }}
                                    value={customCategoryInput[index] !== undefined ? "__custom__" : field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-categoria-${index}`}>
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
                                          const newCategory = customCategoryInput[index].trim();
                                          if (newCategory) {
                                            if (!categorias.includes(newCategory)) {
                                              setCategorias([...categorias, newCategory]);
                                            }
                                            field.onChange(newCategory);
                                            const newInput = { ...customCategoryInput };
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

                            <FormField
                              control={form.control}
                              name={`itens.${index}.valor`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ color: "#004650" }}>
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
                                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
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

                          <FormField
                            control={form.control}
                            name={`itens.${index}.descricao`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel style={{ color: "#004650" }}>
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

                          <FormField
                            control={form.control}
                            name={`itens.${index}.dataDespesa`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel style={{ color: "#004650" }}>
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

                          <div>
                            <FormLabel style={{ color: "#004650" }}>
                              Comprovante (Nota Fiscal/Recibo)
                            </FormLabel>
                            <div className="mt-2 space-y-2">
                              {form.watch(`itens.${index}.comprovante`) && (() => {
                                try {
                                  const comprovanteStr = form.watch(`itens.${index}.comprovante`);
                                  if (!comprovanteStr) return null;
                                  const fileData = JSON.parse(comprovanteStr);
                                  return (
                                    <div className="flex items-center gap-2 text-sm">
                                      <File className="h-4 w-4 text-green-600" />
                                      <a
                                        href={`/${fileData.path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                                        data-testid={`link-comprovante-${index}`}
                                      >
                                        {fileData.originalName || "Comprovante anexado"}
                                      </a>
                                      <span className="text-xs text-muted-foreground">
                                        ({(fileData.size / 1024).toFixed(1)}KB)
                                      </span>
                                    </div>
                                  );
                                } catch {
                                  return (
                                    <div className="flex items-center gap-2 text-sm">
                                      <File className="h-4 w-4 text-green-600" />
                                      <span className="text-xs text-muted-foreground">
                                        Comprovante existente
                                      </span>
                                    </div>
                                  );
                                }
                              })()}
                              {comprovantes[index] && comprovantes[index].length > 0 && (
                                <div className="space-y-1">
                                  {comprovantes[index].map((file, fileIdx) => (
                                    <div key={fileIdx} className="flex items-center gap-2 text-sm">
                                      <Check className="h-4 w-4 text-green-600" />
                                      <span className="text-xs text-muted-foreground truncate">
                                        {file.name}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setComprovantes(prev => {
                                            const updated = { ...prev };
                                            updated[index] = updated[index].filter((_, i) => i !== fileIdx);
                                            if (updated[index].length === 0) {
                                              delete updated[index];
                                            }
                                            return updated;
                                          });
                                        }}
                                        data-testid={`button-remove-file-${index}-${fileIdx}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div>
                                <Input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileChange(index, e.target.files)}
                                  className="cursor-pointer"
                                  data-testid={`input-file-${index}`}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Aceita múltiplos arquivos (imagens e PDF, max 10MB cada)
                                </p>
                              </div>
                            </div>
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

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#4A5458" }}>
                      Valor Total Calculado:
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: "#004650" }}
                      data-testid="total-calculated"
                    >
                      {formatCurrency(totalCalculado)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit"
                      style={{ backgroundColor: "#004650", color: "white" }}
                    >
                      {createMutation.isPending 
                        ? "Salvando..." 
                        : editingId 
                          ? "Atualizar Reembolso" 
                          : "Criar Reembolso"
                      }
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: "#004650" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#4A5458" }}>
                  Total de Reembolsos
                </p>
                <p
                  className="text-3xl font-bold mt-2"
                  style={{ color: "#004650" }}
                  data-testid="summary-total"
                >
                  {summary.total}
                </p>
              </div>
              <FileText className="w-8 h-8" style={{ color: "#004650", opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: "#004650" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "#4A5458" }}>
                  Valor Total
                </p>
                <p
                  className="text-3xl font-bold mt-2"
                  style={{ color: "#004650" }}
                  data-testid="summary-total-value"
                >
                  {formatCurrency(summary.totalValue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8" style={{ color: "#004650", opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : reembolsos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhum reembolso encontrado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira solicitação de reembolso com comprovantes
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reembolsos.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-accent hover:shadow-md transition-shadow"
              data-testid={`reembolso-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Receipt className="w-5 h-5 text-accent-foreground flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Reembolso #{item.id}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.motivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Data:</span>{" "}
                        {formatDate(item.dataSolicitacao!)}
                      </div>
                      {item.centroCusto && (
                        <div>
                          <span className="font-medium">Centro de Custo:</span>{" "}
                          {item.centroCusto}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 ml-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent-foreground mb-2">
                        {formatCurrency(item.valorTotalSolicitado)}
                      </p>
                      <StatusBadge status={item.status || "Solicitado"} />
                    </div>
                    {(canEdit(item) || canDelete(item)) && (
                      <div className="flex gap-2">
                        {canEdit(item) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(item) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o reembolso <strong>#{itemToDelete?.id}</strong> com valor de{" "}
              <strong>{itemToDelete ? formatCurrency(itemToDelete.valorTotalSolicitado) : ""}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
