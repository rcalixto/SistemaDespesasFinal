import {
  Home,
  DollarSign,
  FileText,
  Plane,
  Hotel,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  BarChart3,
  PlaneTakeoff,
  BedDouble,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Visão Geral",
    items: [
      {
        title: "Meu Painel",
        url: "/",
        icon: Home,
        testId: "nav-dashboard",
      },
    ],
  },
  {
    title: "Solicitações",
    items: [
      {
        title: "Adiantamentos",
        url: "/adiantamentos",
        icon: DollarSign,
        testId: "nav-adiantamentos",
      },
      {
        title: "Reembolsos",
        url: "/reembolsos",
        icon: FileText,
        testId: "nav-reembolsos",
      },
      {
        title: "Passagens Aéreas",
        url: "/passagens",
        icon: Plane,
        testId: "nav-passagens",
      },
      {
        title: "Hospedagens",
        url: "/hospedagens",
        icon: Hotel,
        testId: "nav-hospedagens",
      },
    ],
  },
  {
    title: "Execução",
    items: [
      {
        title: "Viagens Executadas",
        url: "/viagens-executadas",
        icon: PlaneTakeoff,
        testId: "nav-viagens-executadas",
      },
      {
        title: "Hospedagens Executadas",
        url: "/hospedagens-executadas",
        icon: BedDouble,
        testId: "nav-hospedagens-executadas",
      },
    ],
  },
  {
    title: "Aprovações",
    items: [
      {
        title: "Pendências Diretoria",
        url: "/pendencias-diretoria",
        icon: Briefcase,
        testId: "nav-pendencias-diretoria",
      },
      {
        title: "Pendências Financeiro",
        url: "/pendencias-financeiro",
        icon: Clock,
        testId: "nav-pendencias-financeiro",
      },
    ],
  },
  {
    title: "Relatórios",
    items: [
      {
        title: "Dashboard Financeiro",
        url: "/dashboard-financeiro",
        icon: BarChart3,
        testId: "nav-dashboard-financeiro",
      },
      {
        title: "Painel de Viagens",
        url: "/painel-viagens",
        icon: PlaneTakeoff,
        testId: "nav-painel-viagens",
      },
      {
        title: "Painel de Hospedagens",
        url: "/painel-hospedagens",
        icon: Building2,
        testId: "nav-painel-hospedagens",
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <div>
            <h2 className="font-bold text-base text-sidebar-foreground">ABERT</h2>
            <p className="text-xs text-muted-foreground">Gestão de Despesas</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={item.testId}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
