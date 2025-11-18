import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  DollarSign,
  FileText,
  Plane,
  Hotel,
  MapPin,
  Building2,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const [location] = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
  ];

  const solicitacoesItems = [
    {
      title: "Adiantamentos",
      url: "/adiantamentos",
      icon: DollarSign,
    },
    {
      title: "Reembolsos",
      url: "/reembolsos",
      icon: FileText,
    },
    {
      title: "Passagens Aéreas",
      url: "/passagens",
      icon: Plane,
    },
    {
      title: "Hospedagens",
      url: "/hospedagens",
      icon: Hotel,
    },
  ];

  const execucoesItems = [
    {
      title: "Viagens Executadas",
      url: "/viagens-executadas",
      icon: MapPin,
    },
    {
      title: "Hospedagens Executadas",
      url: "/hospedagens-executadas",
      icon: Building2,
    },
  ];

  const prestacaoItems = [
    {
      title: "Prestação de Adiantamentos",
      url: "/prestacao-adiantamentos",
      icon: ClipboardCheck,
    },
    {
      title: "Prestação de Reembolsos",
      url: "/prestacao-reembolsos",
      icon: ClipboardCheck,
    },
  ];

  return (
    <Sidebar style={{ backgroundColor: "#F5F8FC" }}>
      <SidebarHeader className="p-4 border-b">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/logo-abert-sidebar.svg"
            alt="ABERT"
            className="h-16 w-auto"
            data-testid="logo-abert-sidebar"
          />
          <p className="text-xs font-medium" style={{ color: "#4A5458" }}>
            Sistema de Gestão de Despesas
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.url}
                  data-testid={`sidebar-link-${item.url.replace("/", "")}`}
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Solicitações */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: "#004650" }}>
            Solicitações
          </SidebarGroupLabel>
          <SidebarMenu>
            {solicitacoesItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.url}
                  data-testid={`sidebar-link-${item.url.replace("/", "")}`}
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Execuções */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: "#004650" }}>
            Execuções
          </SidebarGroupLabel>
          <SidebarMenu>
            {execucoesItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.url}
                  data-testid={`sidebar-link-${item.url.replace("/", "")}`}
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Prestação de Contas */}
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: "#004650" }}>
            Prestação de Contas
          </SidebarGroupLabel>
          <SidebarMenu>
            {prestacaoItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.url}
                  data-testid={`sidebar-link-${item.url.replace("/", "")}`}
                >
                  <Link href={item.url}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => (window.location.href = "/api/logout")}
          data-testid="button-logout-sidebar"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
