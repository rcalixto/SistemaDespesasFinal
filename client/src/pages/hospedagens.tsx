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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Hotel, Calendar, MapPin, Plane, Pencil, Trash2, Upload, File, X, FileText, Paperclip } from "lucide-react";
import { Filters } from "@/components/Filters";
import { StatusBadge } from "@/components/StatusBadge";
import { ComboboxCreatable } from "@/components/ComboboxCreatable";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Hospedagem, PassagemAerea } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().optional(),
  dataCheckin: z.string().min(1, "Data de check-in é obrigatória"),
  dataCheckout: z.string().min(1, "Data de check-out é obrigatória"),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  diretoria: z.string().optional(),
  observacoes: z.string().optional(),
  passagemAereaId: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function Hospedagens() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Hospedagem | null>(null);
  const [anexos, setAnexos] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: hospedagens = [], isLoading } = useQuery<Hospedagem[]>({
    queryKey: ["/api/hospedagens"],
  });

  // Fetch passagens for linking
  const { data: passagens = [] } = useQuery<PassagemAerea[]>({
    queryKey: ["/api/passagens"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      
      cidade: "",
      estado: "",
      dataCheckin: "",
      dataCheckout: "",
      objetivo: "",
      diretoria: "",
      observacoes: "",
      passagemAereaId: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('cidade', data.cidade);
      if (data.estado) formData.append('estado', data.estado);
      formData.append('dataCheckin', data.dataCheckin);
      formData.append('dataCheckout', data.dataCheckout);
      formData.append('objetivo', data.objetivo);
      if (data.diretoria) formData.append('diretoria', data.diretoria);
      if (data.observacoes) formData.append('observacoes', data.observacoes);
      if (data.passagemAereaId) formData.append('passagemAereaId', String(data.passagemAereaId));
      
      // Add files
      anexos.forEach(file => formData.append('anexos', file));

      const url = editingId 
        ? `/api/hospedagens/${editingId}`
        : '/api/hospedagens';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar hospedagem');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospedagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: editingId
          ? "Hospedagem atualizada com sucesso!"
          : "Solicitação de hospedagem criada com sucesso!",
      });
      setDialogOpen(false);
      setEditingId(null);
      setAnexos([]);
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
      return await apiRequest("DELETE", `/api/hospedagens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospedagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Hospedagem excluída com sucesso!",
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

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  const handleEdit = (item: Hospedagem) => {
    setEditingId(item.id);
    form.reset({
      cidade: item.cidade,
      estado: item.estado || "",
      dataCheckin: item.dataCheckin ? new Date(item.dataCheckin).toISOString().split('T')[0] : "",
      dataCheckout: item.dataCheckout ? new Date(item.dataCheckout).toISOString().split('T')[0] : "",
      objetivo: item.objetivo,
      diretoria: item.diretoria || "",
      observacoes: item.observacoes || "",
      passagemAereaId: item.passagemAereaId || null,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: Hospedagem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const canEdit = (item: Hospedagem) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  const canDelete = (item: Hospedagem) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-primary">
            Hospedagens
          </h1>
          <p className="text-foreground">
            Solicite hospedagens para viagens corporativas
          </p>
        </div>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setAnexos([]);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button 
              className="gap-2 bg-accent text-primary hover:bg-accent/90" 
              data-testid="new-hospedagem"
            >
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Hotel className="w-5 h-5" />
                {editingId ? "Editar Hospedagem" : "Nova Solicitação de Hospedagem"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                {/* Section 1: Accommodation Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Hotel className="w-4 h-4" />
                    Detalhes da Hospedagem
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Cidade *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: São Paulo" {...field} data-testid="input-cidade" />
                          </FormControl>
                          <FormDescription>Cidade onde será a hospedagem</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SP" {...field} data-testid="input-estado" />
                          </FormControl>
                          <FormDescription>UF (opcional)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataCheckin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Data de Check-in *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-checkin" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataCheckout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Data de Check-out *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-checkout" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Section 2: Additional Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <FileText className="w-4 h-4" />
                    Informações Adicionais
                  </h3>

                  <FormField
                    control={form.control}
                    name="objetivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary">Objetivo *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o objetivo da hospedagem..." 
                            rows={3}
                            {...field} 
                            data-testid="input-objetivo" 
                          />
                        </FormControl>
                        <FormDescription>Motivo e finalidade da hospedagem</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="diretoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Diretoria</FormLabel>
                          <FormControl>
                            <ComboboxCreatable
                              value={field.value || ""}
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
                      name="passagemAereaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Passagem Relacionada</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-passagem">
                                <SelectValue placeholder="Selecione uma passagem" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma passagem</SelectItem>
                              {passagens.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.origem} → {p.destino} ({formatDate(p.dataIda)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            <Plane className="inline h-4 w-4 mr-1" />
                            Vincule esta hospedagem a uma passagem
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary">Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais (opcional)..." 
                            rows={2}
                            {...field} 
                            data-testid="input-observacoes" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Section 3: Attachments */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Paperclip className="w-4 h-4" />
                    Anexos e Comprovantes
                  </h3>
                  
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors bg-[color:var(--abert-bg)]">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Adicionar Novos Anexos</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Arraste arquivos ou clique para selecionar
                    </p>
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setAnexos(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                      className="cursor-pointer"
                      data-testid="input-anexos"
                    />
                    <FormDescription className="mt-2">
                      Anexe documentos, comprovantes ou informações complementares
                    </FormDescription>
                  </div>
                  
                  {/* Selected Files Preview */}
                  {anexos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Arquivos Selecionados ({anexos.length})</p>
                      <div className="space-y-1">
                        {anexos.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30">
                            <FileText className="w-4 h-4" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setAnexos(prev => prev.filter((_, i) => i !== index))}
                              data-testid={`button-remove-file-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={createMutation.isPending}
                  data-testid="submit-hospedagem"
                >
                  {createMutation.isPending 
                    ? "Salvando..." 
                    : editingId 
                      ? "Atualizar Hospedagem" 
                      : "Solicitar Hospedagem"
                  }
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Filters onFilterChange={() => {}} showCentroCusto={false} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : hospedagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Hotel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma solicitação de hospedagem encontrada
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hospedagens.map((item) => (
            <Card
              key={item.id}
              className="hover-elevate transition-all border-l-4 border-l-primary"
              data-testid={`hospedagem-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header: Title + Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Hotel className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-primary">
                        {item.cidade}{item.estado && `, ${item.estado}`}
                      </h3>
                    </div>
                    <StatusBadge status={item.status || "Solicitado"} />
                  </div>
                  
                  <Separator />
                  
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="font-medium text-foreground">{formatDate(item.dataCheckin)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Check-out:</span>
                      <span className="font-medium text-foreground">{formatDate(item.dataCheckout)}</span>
                    </div>
                    {item.diretoria && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Diretoria:</span>
                        <span className="font-medium text-foreground">{item.diretoria}</span>
                      </div>
                    )}
                    {item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Anexos:</span>
                        <span className="font-medium text-foreground">{item.anexos.length}</span>
                      </div>
                    )}
                    {item.passagemAereaId && (
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Passagem:</span>
                        <span className="font-medium text-foreground">Vinculada</span>
                      </div>
                    )}
                  </div>
                  
                  {item.objetivo && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="font-medium mb-1 text-foreground">Objetivo:</p>
                        <p className="text-muted-foreground">{item.objetivo}</p>
                      </div>
                    </>
                  )}
                  
                  {/* Actions */}
                  {(canEdit(item) || canDelete(item)) && (
                    <>
                      <Separator />
                      <div className="flex gap-2 justify-end">
                        {canEdit(item) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
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
                    </>
                  )}
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
              Tem certeza que deseja excluir a hospedagem em{" "}
              <strong>{itemToDelete?.cidade}</strong>? 
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
