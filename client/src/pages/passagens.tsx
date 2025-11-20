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
import { Plus, Plane, Calendar, Hotel, Pencil, Trash2, Upload, File, X, FileText, Paperclip, MapPin } from "lucide-react";
import { Filters } from "@/components/Filters";
import { StatusBadge } from "@/components/StatusBadge";
import { ComboboxCreatable } from "@/components/ComboboxCreatable";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PassagemAerea, Hospedagem } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  
  origem: z.string().min(1, "Origem é obrigatória"),
  destino: z.string().min(1, "Destino é obrigatório"),
  dataIda: z.string().min(1, "Data de ida é obrigatória"),
  dataVolta: z.string().optional(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  diretoria: z.string().optional(),
  observacoes: z.string().optional(),
  hospedagemId: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function Passagens() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PassagemAerea | null>(null);
  const [anexos, setAnexos] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: passagens = [], isLoading } = useQuery<PassagemAerea[]>({
    queryKey: ["/api/passagens"],
  });

  // Fetch hospedagens for linking
  const { data: hospedagens = [] } = useQuery<Hospedagem[]>({
    queryKey: ["/api/hospedagens"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      
      origem: "",
      destino: "",
      dataIda: "",
      dataVolta: "",
      objetivo: "",
      diretoria: "",
      observacoes: "",
      hospedagemId: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('origem', data.origem);
      formData.append('destino', data.destino);
      formData.append('dataIda', data.dataIda);
      if (data.dataVolta) formData.append('dataVolta', data.dataVolta);
      formData.append('objetivo', data.objetivo);
      if (data.diretoria) formData.append('diretoria', data.diretoria);
      if (data.observacoes) formData.append('observacoes', data.observacoes);
      if (data.hospedagemId) formData.append('hospedagemId', String(data.hospedagemId));
      
      // Add files
      anexos.forEach(file => formData.append('anexos', file));

      const url = editingId 
        ? `/api/passagens/${editingId}`
        : '/api/passagens';
      
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar passagem');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: editingId
          ? "Passagem atualizada com sucesso!"
          : "Solicitação de passagem criada com sucesso!",
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
      return await apiRequest("DELETE", `/api/passagens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Passagem excluída com sucesso!",
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

  const handleEdit = (item: PassagemAerea) => {
    setEditingId(item.id);
    form.reset({
      origem: item.origem,
      destino: item.destino,
      dataIda: item.dataIda ? new Date(item.dataIda).toISOString().split('T')[0] : "",
      dataVolta: item.dataVolta ? new Date(item.dataVolta).toISOString().split('T')[0] : "",
      objetivo: item.objetivo,
      diretoria: item.diretoria || "",
      observacoes: item.observacoes || "",
      hospedagemId: item.hospedagemId || null,
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: PassagemAerea) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const canEdit = (item: PassagemAerea) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  const canDelete = (item: PassagemAerea) => {
    return item.status === "Solicitado" || item.status === "Rejeitado";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Passagens Aéreas
          </h1>
          <p className="text-muted-foreground">
            Solicite passagens aéreas para viagens corporativas
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
            <Button className="gap-2" data-testid="new-passagem">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                {editingId ? "Editar Passagem Aérea" : "Nova Solicitação de Passagem Aérea"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
                {/* Section 1: Main Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Informações da Viagem
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} data-testid="input-origem" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Rio de Janeiro" {...field} data-testid="input-destino" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataIda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Ida *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-ida" />
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
                        <FormLabel>Data de Volta</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-volta" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="objetivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva o objetivo da viagem" {...field} data-testid="input-objetivo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diretoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diretoria</FormLabel>
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
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Informações adicionais (opcional)" {...field} data-testid="input-observacoes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hospedagemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospedagem Relacionada (Opcional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                          value={field.value?.toString() || "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-hospedagem">
                              <SelectValue placeholder="Selecione uma hospedagem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma hospedagem</SelectItem>
                            {hospedagens.map((h) => (
                              <SelectItem key={h.id} value={h.id.toString()}>
                                {h.localidade} - {h.nomeHotel} ({formatDate(h.checkIn)} até {formatDate(h.checkOut)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <Hotel className="inline h-4 w-4 mr-1" />
                          Vincule esta passagem a uma solicitação de hospedagem existente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Section 2: Attachments */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Anexos e Comprovantes
                  </h3>
                  
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
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
                            <span className="text-xs">{formatFileSize(file.size)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setAnexos(prev => prev.filter((_, i) => i !== index))}
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
                  className="w-full"
                  size="lg"
                  disabled={createMutation.isPending}
                  data-testid="submit-passagem"
                >
                  {createMutation.isPending 
                    ? "Salvando..." 
                    : editingId 
                      ? "Atualizar Passagem" 
                      : "Solicitar Passagem"
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
      ) : passagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma solicitação de passagem encontrada
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {passagens.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
              data-testid={`passagem-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Plane className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.origem} → {item.destino}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Ida: {formatDate(item.dataIda)}
                          {item.dataVolta && ` | Volta: ${formatDate(item.dataVolta)}`}
                        </span>
                      </div>
                    </div>
                    {item.anexos && Array.isArray(item.anexos) && item.anexos.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Anexos:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.anexos.map((anexo: any, idx: number) => (
                            <a
                              key={idx}
                              href={`/uploads/${anexo.path.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <File className="w-3 h-3" />
                              {anexo.originalName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={item.status || "Solicitado"} />
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
              Tem certeza que deseja excluir a passagem aérea de{" "}
              <strong>{itemToDelete?.origem} → {itemToDelete?.destino}</strong>? 
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
