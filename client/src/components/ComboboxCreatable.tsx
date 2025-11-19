import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Option {
  id: number;
  nome: string;
}

interface ComboboxCreatableProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  createText?: string;
  searchText?: string;
  apiEndpoint: string;
  queryKey: string;
  label?: string;
  testId?: string;
}

export function ComboboxCreatable({
  value,
  onValueChange,
  placeholder = "Selecione...",
  emptyText = "Nenhum item encontrado",
  createText = "Criar",
  searchText = "Buscar",
  apiEndpoint,
  queryKey,
  label,
  testId,
}: ComboboxCreatableProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: options = [], isLoading } = useQuery<Option[]>({
    queryKey: [queryKey],
  });

  const createMutation = useMutation({
    mutationFn: async (nome: string) => {
      return await apiRequest(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({ nome }),
      });
    },
    onSuccess: (newOption: Option) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onValueChange(newOption.nome);
      setOpen(false);
      setSearch("");
      toast({
        title: "Sucesso!",
        description: `${label || "Item"} criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || `Erro ao criar ${label?.toLowerCase() || "item"}`,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (search.trim()) {
      createMutation.mutate(search.trim());
    }
  };

  const filteredOptions = options.filter((option) =>
    option.nome.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = filteredOptions.some(
    (option) => option.nome.toLowerCase() === search.toLowerCase()
  );

  const showCreateOption = search.trim() && !exactMatch && !createMutation.isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid={testId}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`${searchText}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Carregando..." : emptyText}
            </CommandEmpty>
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.nome}
                    onSelect={() => {
                      onValueChange(option.nome);
                      setOpen(false);
                      setSearch("");
                    }}
                    data-testid={`option-${option.nome.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.nome ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreateOption && (
              <>
                {filteredOptions.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreate}
                    data-testid="button-create-new"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createText} "{search}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
            {createMutation.isPending && (
              <CommandGroup>
                <CommandItem disabled>Criando...</CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
