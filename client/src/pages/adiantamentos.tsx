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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Calendar, MapPin, TrendingUp, DollarSign, Pencil, Trash2 } from "lucide-react";
import { Filters } from "@/components/Filters";
import { FileUpload } from "@/components/FileUpload";
import { StatusBadge } from "@/components/StatusBadge";
import { ComboboxCreatable } from "@/components/ComboboxCreatable";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Adiantamento } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  localViagem: z.string().min(1, "Local da viagem é obrigatório"),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  dataIda: z.string().min(1, "Data de ida é obrigatória"),
  dataVolta: z.string().min(1, "Data de volta é obrigatória"),
  valorSolicitado: z.coerce.number().positive("Valor deve ser maior que zero"),
  diretoriaResponsavel: z.string().min(1, "Diretoria é obrigatória"),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Adiantamentos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Adiantamento | null>(null);
  const [anexos, setAnexos] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: adiantamentos = [], isLoading } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      localViagem: "",
      motivo: "",
      dataIda: "",
      dataVolta: "",
      valorSolicitado: 0,
      diretoriaResponsavel: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      
      // Add all form fields to FormData
      formData.append("localViagem", data.localViagem);
      formData.append("motivo", data.motivo);
      formData.append("dataIda", data.dataIda);
      formData.append("dataVolta", data.dataVolta);
      formData.append("valorSolicitado", data.valorSolicitado.toString());
      formData.append("diretoriaResponsavel", data.diretoriaResponsavel);
      if (data.observacoes) {
        formData.append("observacoes", data.observacoes);
      }

      // Add anexos (files)
      anexos.forEach((file) => {
        formData.append("anexos", file);
      });

      // Send FormData instead of JSON
      const url = editingId ? `/api/adiantamentos/${editingId}` : "/api/adiantamentos";
      const method = editingId ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar adiantamento");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adiantamentos"] });
      toast({
        title: "Sucesso",
        description: editingId ? "Adiantamento atualizado com sucesso!" : "Adiantamento criado com sucesso!",
      });
      setDialogOpen(false);
      setEditingId(null);
      form.reset();
      setAnexos([]);
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
      return await apiRequest("DELETE", `/api/adiantamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adiantamentos"] });
      toast({
        title: "Sucesso",
        description: "Adiantamento excluído com sucesso!",
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
    createMutation.mutate({
      ...data,
      valorSolicitado: Number(data.valorSolicitado),
    });
  };

  const handleFilterChange = (filters: any) => {
    // TODO: Implement filtering
    console.log("Filters:", filters);
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

  const handleEdit = (item: Adiantamento) => {
    setEditingId(item.id);
    form.reset({
      localViagem: item.localViagem,
      motivo: item.motivo,
      dataIda: item.dataIda ? new Date(item.dataIda).toISOString().split('T')[0] : '',
      dataVolta: item.dataVolta ? new Date(item.dataVolta).toISOString().split('T')[0] : '',
      valorSolicitado: Number(item.valorSolicitado),
      diretoriaResponsavel: item.diretoriaResponsavel,
      observacoes: item.observacoes || '',
    });
    setAnexos([]);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingId(null);
      form.reset();
      setAnexos([]);
    }
  };

  const handleDelete = (item: Adiantamento) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const canEdit = (item: Adiantamento) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  const canDelete = (item: Adiantamento) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  // Calculate summary
  const summary = {
    total: adiantamentos.length,
    totalValue: adiantamentos.reduce(
      (acc, a) => acc + Number(a.valorSolicitado || 0),
      0
    ),
    byStatus: adiantamentos.reduce(
      (acc, a) => {
        const status = a.status || "Solicitado";
        if (!acc[status]) {
          acc[status] = { count: 0, value: 0 };
        }
        acc[status].count++;
        acc[status].value += Number(a.valorSolicitado || 0);
        return acc;
      },
      {} as Record<string, { count: number; value: number }>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Adiantamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas solicitações de adiantamento para viagens
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-adiantamento">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Adiantamento" : "Nova Solicitação de Adiantamento"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="localViagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local da Viagem *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: São Paulo, SP"
                          {...field}
                          data-testid="input-local-viagem"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o motivo da viagem"
                          {...field}
                          data-testid="input-motivo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataIda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Ida *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-data-ida"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataVolta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Volta *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-data-volta"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="valorSolicitado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Solicitado (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-valor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diretoriaResponsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diretoria Responsável *</FormLabel>
                      <FormControl>
                        <ComboboxCreatable
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecione ou crie uma diretoria"
                          emptyText="Nenhuma diretoria encontrada"
                          createText="Criar diretoria"
                          searchText="Buscar diretoria"
                          apiEndpoint="/api/diretorias"
                          queryKey="/api/diretorias"
                          label="Diretoria"
                          testId="select-diretoria"
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
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais (opcional)"
                          {...field}
                          data-testid="input-observacoes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-2 block">Anexar Documentos (Opcional)</Label>
                  <FileUpload
                    onUploadSuccess={setAnexos}
                    maxFiles={5}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="submit-adiantamento"
                >
                  {createMutation.isPending ? "Enviando..." : "Solicitar Adiantamento"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Solicitações</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {summary.total}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatCurrency(summary.totalValue)} acumulado
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(summary.byStatus)
            .slice(0, 3)
            .map(([status, data]) => (
              <Card key={status}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {status}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {data.count}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {formatCurrency(data.value)}
                      </p>
                    </div>
                    <div className="p-2 bg-accent/10 rounded-full flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-accent-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Filters */}
      <Filters onFilterChange={handleFilterChange} />

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : adiantamentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhum adiantamento encontrado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira solicitação de adiantamento
            </p>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {adiantamentos.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
              data-testid={`adiantamento-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {item.localViagem}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{item.motivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(item.dataIda)} até {formatDate(item.dataVolta)}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="font-medium">Diretoria:</span>{" "}
                        {item.diretoriaResponsavel}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary mb-2">
                        {formatCurrency(item.valorSolicitado)}
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
              Tem certeza que deseja excluir o adiantamento para{" "}
              <strong>{itemToDelete?.localViagem}</strong>? Esta ação não pode ser desfeita.
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
