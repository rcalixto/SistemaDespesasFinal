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
import { Plus, Hotel, Calendar, MapPin, Plane, Pencil, Trash2, Upload, File, X } from "lucide-react";
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Hospedagens</h1>
          <p className="text-muted-foreground">
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
            <Button className="gap-2" data-testid="new-hospedagem">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Hospedagem" : "Nova Solicitação de Hospedagem"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} data-testid="input-cidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SP" {...field} data-testid="input-estado" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataCheckin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Check-in *</FormLabel>
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
                        <FormLabel>Data de Check-out *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-checkout" />
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
                        <Textarea placeholder="Descreva o objetivo da hospedagem" {...field} data-testid="input-objetivo" />
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
                  name="passagemAereaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passagem Aérea Relacionada (Opcional)</FormLabel>
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
                        Vincule esta hospedagem a uma solicitação de passagem existente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Anexos</FormLabel>
                  <div className="border-2 border-dashed rounded-md p-4">
                    <div className="flex items-center justify-center">
                      <label className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Clique para selecionar arquivos
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setAnexos(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                          data-testid="input-anexos"
                        />
                      </label>
                    </div>
                    {anexos.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Arquivos selecionados:</p>
                        {anexos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAnexos(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
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
              className="border-l-4 border-l-accent hover:shadow-md transition-shadow"
              data-testid={`hospedagem-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="w-5 h-5 text-accent-foreground flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.cidade}{item.estado && `, ${item.estado}`}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(item.dataCheckin)} até {formatDate(item.dataCheckout)}
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
